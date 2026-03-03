import express from "express";
import {
    upload,
    uploadDocuments,
    getDocuments,
    deleteDocument,
    reindexDocument,
    getDocumentStatus,
} from "../controllers/document.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect); // All document routes require auth

router.get("/", getDocuments);
router.get("/:id/status", getDocumentStatus);

// Admin-only routes
router.post("/upload", adminOnly, upload.array("files", 10), uploadDocuments);
router.delete("/:id", adminOnly, deleteDocument);
router.post("/:id/reindex", adminOnly, reindexDocument);

export default router;
