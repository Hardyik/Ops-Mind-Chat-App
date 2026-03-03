import jwt from "jsonwebtoken";
import User from "../models/User.js";

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || "opsmind_super_secret_jwt_key_2024", {
        expiresIn: "7d",
    });
};

// POST /api/auth/signup
export const signup = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email, and password are required" });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ message: "User already exists with this email" });
        }

        const user = await User.create({ name, email, password, role: role || "employee" });

        res.status(201).json({
            token: generateToken(user._id),
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
            },
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// POST /api/auth/login
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        res.json({
            token: generateToken(user._id),
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
            },
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
    try {
        res.json({
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                avatar: req.user.avatar,
            },
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// GET /api/auth/users (admin only)
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password").sort({ createdAt: -1 });
        res.json({ users });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
