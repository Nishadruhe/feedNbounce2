import mongoose from "mongoose";
import fs from "fs";
import path from "path";

// Simple file-based storage as fallback
const dbFile = path.join(process.cwd(), 'data.json');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(`⚠️ MongoDB failed. Using file storage...`);
    // Create empty data file if it doesn't exist
    if (!fs.existsSync(dbFile)) {
      fs.writeFileSync(dbFile, JSON.stringify({ users: [], feedbacks: [] }));
    }
    console.log(`✅ File storage ready: ${dbFile}`);
  }
};

export default connectDB;

