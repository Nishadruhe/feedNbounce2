// backend/routes/adminRoutes.js
import express from "express";
import jwt from "jsonwebtoken";
import { getAllFeedbacks, countUsers } from "../utils/fileDb.js";

const router = express.Router();

// JWT Auth
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Admin check
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Forbidden: Admins only" });
  next();
};

//  Stats
router.get("/stats", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const feedbacks = await getAllFeedbacks();
    const productCount = feedbacks.filter(f => f.category === "product").length;
    const serviceCount = feedbacks.filter(f => f.category === "service").length;
    const totalUsers = await countUsers();
    res.json({ productCount, serviceCount, totalUsers });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ message: "Error loading admin stats" });
  }
});

// Sentiment Analysis
router.get("/sentiments", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const feedbacks = await getAllFeedbacks();
    let positive = 0, neutral = 0, negative = 0;

    feedbacks.forEach((f) => {
      const text = f.message?.toLowerCase() || "";
      if (
        text.includes("good") ||
        text.includes("excellent") ||
        text.includes("great") ||
        text.includes("awesome") ||
        text.includes("nice") ||
        text.includes("amazing")
      )
        positive++;
      else if (
        text.includes("average") ||
        text.includes("ok") ||
        text.includes("fine")
      )
        neutral++;
      else if (
        text.includes("bad") ||
        text.includes("poor") ||
        text.includes("terrible") ||
        text.includes("worst")
      )
        negative++;
      else neutral++;
    });

    res.json({ positive, neutral, negative });
  } catch (err) {
    console.error("Sentiment error:", err);
    res.status(500).json({ message: "Failed to load sentiments" });
  }
});

// 📬 All feedbacks
router.get("/feedbacks", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const feedbacks = await getAllFeedbacks();
    res.json(feedbacks);
  } catch (err) {
    console.error("Admin feedback fetch error:", err);
    res.status(500).json({ message: "Failed to fetch feedbacks" });
  }
});

export default router;
