import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        return res.status(401).json({ message: "No token, authorization denied" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "opsmind_super_secret_jwt_key_2024");
        req.user = await User.findById(decoded.id).select("-password");
        if (!req.user) return res.status(401).json({ message: "User not found" });
        next();
    } catch (err) {
        res.status(401).json({ message: "Token is not valid" });
    }
};

export const adminOnly = (req, res, next) => {
    if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
    }
    next();
};
