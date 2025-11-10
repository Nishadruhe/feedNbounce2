// // backend/routes/authRoutes.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { findUser, createUser } from "../utils/fileDb.js";

const router = express.Router();

// 🚀 Register new user
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existingUser = await findUser(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user_id = generateUserId();

    const user = await createUser({
      user_id,
      name,
      email,
      password: hashedPassword,
      role: role || "user", // default user
    });

    const token = jwt.sign(
      { id: user._id, user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      id: user._id,
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

// Generate unique user ID
function generateUserId() {
  return 'USR' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 4).toUpperCase();
}

// 🚀 Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await findUser(email);
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      id: user._id,
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});



export default router;
