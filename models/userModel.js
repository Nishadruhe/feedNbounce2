import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  user_id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin", "guest"], default: "user" },
});

export default mongoose.model("User", userSchema);

