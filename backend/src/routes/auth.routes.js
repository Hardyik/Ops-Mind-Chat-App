import express from "express";
import { signup, login, getMe, getAllUsers } from "../controllers/auth.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", protect, getMe);
router.get("/users", protect, adminOnly, getAllUsers);

export default router;
