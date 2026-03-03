import express from "express";
import {
    sendMessage,
    getConversations,
    getConversation,
    deleteConversation,
} from "../controllers/chat.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect); // All chat routes require auth

router.post("/send", sendMessage);
router.get("/conversations", getConversations);
router.get("/conversations/:id", getConversation);
router.delete("/conversations/:id", deleteConversation);

export default router;
