// backend/scripts/importDataJson.js
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });

const dbFile = path.join(process.cwd(), 'data.json');

const userSchema = new mongoose.Schema({
  user_id: { type: String, index: true },
  name: String,
  email: { type: String, unique: true, index: true },
  password: String,
  role: String,
});
const feedbackSchema = new mongoose.Schema({
  user_id: { type: String, index: true },
  user_type: String,
  category: String,
  item_name: String,
  message: String,
  createdAt: Date,
});
const User = mongoose.models.User || mongoose.model('User', userSchema);
const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema);

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    if (!fs.existsSync(dbFile)) {
      console.log('No data.json found. Nothing to import.');
      process.exit(0);
    }
    const raw = fs.readFileSync(dbFile, 'utf8');
    const data = JSON.parse(raw || '{"users":[],"feedbacks":[]}');

    // Upsert users by email
    for (const u of data.users || []) {
      await User.updateOne(
        { email: u.email },
        { $set: { user_id: u.user_id, name: u.name, email: u.email, password: u.password, role: u.role || 'user' } },
        { upsert: true }
      );
    }

    // Insert feedbacks (skip duplicates by message+createdAt heuristic)
    for (const f of data.feedbacks || []) {
      const createdAt = f.createdAt ? new Date(f.createdAt) : new Date();
      const exists = await Feedback.findOne({ user_id: f.user_id, message: f.message, createdAt });
      if (!exists) {
        await Feedback.create({
          user_id: f.user_id,
          user_type: f.user_type,
          category: f.category,
          item_name: f.item_name,
          message: f.message,
          createdAt,
        });
      }
    }

    console.log('Import complete.');
    process.exit(0);
  } catch (e) {
    console.error('Import failed:', e);
    process.exit(1);
  }
})();