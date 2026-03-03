import mongoose from "mongoose";

const chunkSchema = new mongoose.Schema({
    text: { type: String, required: true },
    pageNumber: { type: Number, default: 1 },
    chunkIndex: { type: Number, default: 0 },
});

const documentSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        originalName: { type: String, required: true },
        filePath: { type: String, required: true },
        fileSize: { type: Number, required: true },
        pageCount: { type: Number, default: 0 },
        status: {
            type: String,
            enum: ["uploading", "parsing", "chunking", "embedding", "indexed", "error"],
            default: "uploading",
        },
        chunks: [chunkSchema],
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        totalChunks: { type: Number, default: 0 },
        errorMessage: { type: String, default: "" },
    },
    { timestamps: true }
);

export default mongoose.model("Document", documentSchema);
