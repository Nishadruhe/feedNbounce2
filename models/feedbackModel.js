// backend/models/feedbackModel.js
import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true }, // Can be registered user ID or guest ID
    user_type: { type: String, enum: ["registered", "guest"], required: true },
    category: { type: String, enum: ["product", "service"], required: true },
    item_name: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Feedback", feedbackSchema);
