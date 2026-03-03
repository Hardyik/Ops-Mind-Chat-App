import mongoose from "mongoose";

const citationSchema = new mongoose.Schema({
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document" },
    documentName: { type: String },
    pageNumber: { type: Number },
    snippet: { type: String },
});

const messageSchema = new mongoose.Schema({
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    citations: [citationSchema],
    isGuardrail: { type: Boolean, default: false },
    suggestedQuestions: [{ type: String }],
    timestamp: { type: Date, default: Date.now },
});

const conversationSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        messages: [messageSchema],
    },
    { timestamps: true }
);

export default mongoose.model("Conversation", conversationSchema);
