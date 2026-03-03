import express from "express";
import {
    getDashboardStats,
    getTopTopics,
    getTopDocuments,
    getQueryVolume,
    getRecentQueries,
} from "../controllers/dashboard.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect, adminOnly); // All dashboard routes are admin-only

router.get("/stats", getDashboardStats);
router.get("/top-topics", getTopTopics);
router.get("/top-documents", getTopDocuments);
router.get("/query-volume", getQueryVolume);
router.get("/recent-queries", getRecentQueries);

export default router;
