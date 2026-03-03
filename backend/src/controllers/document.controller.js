import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import pdfParse from "pdf-parse";
import Document from "../models/Document.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer config — accept only PDFs
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${path.extname(file.originalname)}`);
    },
});

export const upload = multer({
    storage,
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only PDF files are accepted"), false);
        }
    },
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

/**
 * Splits text into overlapping chunks of ~500 words
 */
function chunkText(text, chunkSize = 500, overlap = 50) {
    const words = text.split(/\s+/);
    const chunks = [];
    let i = 0;

    while (i < words.length) {
        chunks.push(words.slice(i, i + chunkSize).join(" "));
        i += chunkSize - overlap;
    }

    return chunks;
}

/**
 * Process a PDF: parse → chunk → save to DB
 */
async function processPDF(docId, filePath, originalName) {
    try {
        // Step: parsing
        await Document.findByIdAndUpdate(docId, { status: "parsing" });

        const fileBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(fileBuffer);
        const rawText = pdfData.text;
        const pageCount = pdfData.numpages;

        // Step: chunking
        await Document.findByIdAndUpdate(docId, { status: "chunking", pageCount });

        const textChunks = chunkText(rawText, 500, 50);
        const chunks = textChunks.map((text, idx) => ({
            text,
            pageNumber: Math.ceil(((idx + 1) / textChunks.length) * pageCount) || 1,
            chunkIndex: idx,
        }));

        // Step: "embedding" (we're using keyword search, so just mark it)
        await Document.findByIdAndUpdate(docId, { status: "embedding" });

        // Small delay to simulate embedding
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Step: indexed — save chunks
        await Document.findByIdAndUpdate(docId, {
            status: "indexed",
            chunks,
            totalChunks: chunks.length,
            pageCount,
        });

        console.log(`✅ Document indexed: ${originalName} (${chunks.length} chunks)`);
    } catch (err) {
        console.error(`❌ Error processing document ${docId}:`, err.message);
        await Document.findByIdAndUpdate(docId, {
            status: "error",
            errorMessage: err.message,
        });
    }
}

/**
 * POST /api/documents/upload
 * Upload one or more PDF files
 */
export const uploadDocuments = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "No files uploaded" });
        }

        const savedDocs = [];

        for (const file of req.files) {
            const doc = await Document.create({
                name: file.originalname,
                originalName: file.originalname,
                filePath: file.path,
                fileSize: file.size,
                status: "uploading",
                uploadedBy: req.user._id,
            });

            savedDocs.push(doc);

            // Process asynchronously — don't block the response
            processPDF(doc._id, file.path, file.originalname).catch(console.error);
        }

        res.status(201).json({
            message: `${savedDocs.length} file(s) uploaded and processing started`,
            documents: savedDocs.map((d) => ({
                id: d._id,
                name: d.name,
                status: d.status,
                fileSize: d.fileSize,
                uploadDate: d.createdAt,
            })),
        });
    } catch (err) {
        res.status(500).json({ message: "Upload failed", error: err.message });
    }
};

/**
 * GET /api/documents
 * Get all documents with their status
 */
export const getDocuments = async (req, res) => {
    try {
        const documents = await Document.find()
            .select("-chunks") // Don't send chunks in list view (too large)
            .sort({ createdAt: -1 });

        const docs = documents.map((d) => ({
            id: d._id,
            name: d.name,
            uploadDate: d.createdAt,
            pageCount: d.pageCount,
            status: d.status,
            size: `${(d.fileSize / 1024 / 1024).toFixed(1)} MB`,
            totalChunks: d.totalChunks,
            errorMessage: d.errorMessage,
        }));

        res.json({ documents: docs });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

/**
 * DELETE /api/documents/:id
 */
export const deleteDocument = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ message: "Document not found" });

        // Delete the physical file
        if (fs.existsSync(doc.filePath)) {
            fs.unlinkSync(doc.filePath);
        }

        await doc.deleteOne();
        res.json({ message: "Document deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

/**
 * POST /api/documents/:id/reindex
 * Re-process an existing document
 */
export const reindexDocument = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ message: "Document not found" });

        if (!fs.existsSync(doc.filePath)) {
            return res.status(400).json({ message: "PDF file not found on disk" });
        }

        // Reset status and re-process
        await Document.findByIdAndUpdate(doc._id, {
            status: "uploading",
            chunks: [],
            totalChunks: 0,
            errorMessage: "",
        });

        processPDF(doc._id, doc.filePath, doc.originalName).catch(console.error);

        res.json({ message: "Re-indexing started" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

/**
 * GET /api/documents/:id/status
 * Poll a document's current processing status
 */
export const getDocumentStatus = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id).select("-chunks");
        if (!doc) return res.status(404).json({ message: "Document not found" });

        res.json({
            id: doc._id,
            name: doc.name,
            status: doc.status,
            pageCount: doc.pageCount,
            totalChunks: doc.totalChunks,
            errorMessage: doc.errorMessage,
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
