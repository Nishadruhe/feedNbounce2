// backend/routes/feedbackRoutes.js
import express from "express";
import jwt from "jsonwebtoken";
import { createFeedback, getUserFeedbacks } from "../utils/fileDb.js";


const router = express.Router();

// 🔐 Middleware to verify JWT
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

// ✉️ POST feedback (for registered users)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { category, item_name, message } = req.body;
    if (!category || !item_name || !message)
      return res.status(400).json({ message: "All fields required" });

    await createFeedback({
      user_id: req.user.user_id,
      user_type: "registered",
      category,
      item_name,
      message,
    });
    res.json({ message: "Feedback submitted successfully" });
  } catch (error) {
    console.error("Feedback error:", error);
    res.status(500).json({ message: "Failed to submit feedback" });
  }
});

// ✉️ POST feedback for guests
router.post("/guest", async (req, res) => {
  try {
    const { category, item_name, message } = req.body;
    if (!category || !item_name || !message)
      return res.status(400).json({ message: "All fields required" });

    const guest_id = generateGuestId();
    await createFeedback({
      user_id: guest_id,
      user_type: "guest",
      category,
      item_name,
      message,
    });
    res.json({ message: "Feedback submitted successfully", guest_id });
  } catch (error) {
    console.error("Guest feedback error:", error);
    res.status(500).json({ message: "Failed to submit feedback" });
  }
});

// Generate guest ID
function generateGuestId() {
  return 'GST' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 4).toUpperCase();
}

// GET feedback history for logged-in user
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const feedbacks = await getUserFeedbacks(req.user.user_id);
    res.json(feedbacks);
  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ message: "Failed to fetch history" });
  }
});

export default router;


