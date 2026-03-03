import mongoose from "mongoose";

const queryLogSchema = new mongoose.Schema(
    {
        query: { type: String, required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        userName: { type: String },
        documentsReferenced: [{ type: String }],
        isGuardrail: { type: Boolean, default: false },
        responseTimeMs: { type: Number, default: 0 },
        conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" },
    },
    { timestamps: true }
);

export default mongoose.model("QueryLog", queryLogSchema);
