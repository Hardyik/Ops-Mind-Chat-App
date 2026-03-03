import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import documentRoutes from "./routes/document.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

dotenv.config();
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
    origin: ["http://localhost:8080", "http://localhost:5173", "http://localhost:3000"],
    credentials: true,
}));
app.use(express.json());

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Health check
app.get("/api/health", (_req, res) => {
    res.json({ status: "OK", message: "OpsMind API is running 🧠", timestamp: new Date() });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 OpsMind backend running on port ${PORT}`));
