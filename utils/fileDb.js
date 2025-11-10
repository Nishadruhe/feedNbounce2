// backend/utils/fileDb.js
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

const dbFile = path.join(process.cwd(), 'data.json');

// Fallback file helpers
const readData = () => {
  try {
    const data = fs.readFileSync(dbFile, 'utf8');
    return JSON.parse(data);
  } catch {
    return { users: [], feedbacks: [] };
  }
};

const writeData = (data) => {
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
};

// Mongo readiness
const isMongo = () => mongoose?.connection?.readyState === 1;

// Schemas/Models (guarded to avoid recompilation in dev)
const userSchema = new mongoose.Schema(
  {
    user_id: { type: String, index: true }, // your custom USR... id
    name: String,
    email: { type: String, unique: true, index: true },
    password: String,
    role: { type: String, default: 'user' },
  },
  { timestamps: true }
);

const feedbackSchema = new mongoose.Schema(
  {
    user_id: { type: String, index: true }, // may be custom USR... or a Mongo _id string, routes currently pass custom user_id
    user_type: { type: String, enum: ['registered', 'guest'] },
    category: String,
    item_name: String,
    message: String,
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema);

// API: findUser(email)
export const findUser = async (email) => {
  if (isMongo()) {
    return await User.findOne({ email }).lean();
  }
  const data = readData();
  return data.users.find((u) => u.email === email);
};

// API: createUser(user)
export const createUser = async (user) => {
  if (isMongo()) {
    const doc = await User.create(user);
    return {
      _id: doc._id.toString(),
      user_id: doc.user_id,
      name: doc.name,
      email: doc.email,
      password: doc.password,
      role: doc.role,
    };
  }
  const data = readData();
  const newUser = { ...user, _id: Date.now().toString() };
  data.users.push(newUser);
  writeData(data);
  return newUser;
};

// API: createFeedback(feedback)
export const createFeedback = async (feedback) => {
  if (isMongo()) {
    const doc = await Feedback.create({ ...feedback, createdAt: new Date() });
    return {
      _id: doc._id.toString(),
      ...feedback,
      createdAt: doc.createdAt,
    };
  }
  const data = readData();
  const newFeedback = { ...feedback, _id: Date.now().toString(), createdAt: new Date() };
  data.feedbacks.push(newFeedback);
  writeData(data);
  return newFeedback;
};

// API: getUserFeedbacks(userIdFromToken)
// Note: routes pass req.user.id in history endpoint, but feedbacks are saved with req.user.user_id.
// Support both by matching on either.
export const getUserFeedbacks = async (userIdFromToken) => {
  if (isMongo()) {
    const feedbacks = await Feedback.find({
      $or: [{ user_id: userIdFromToken }, { user_id: userIdFromToken?.toString() }],
    })
      .sort({ createdAt: -1 })
      .lean();
    return feedbacks;
  }
  const data = readData();
  return data.feedbacks.filter((f) => f.user_id === userIdFromToken);
};

// API: getAllFeedbacks()
export const getAllFeedbacks = async () => {
  if (isMongo()) {
    const feedbacks = await Feedback.find({}).sort({ createdAt: -1 }).lean();

    // Fetch related users in one go (for registered feedbacks)
    const registeredUserIds = [
      ...new Set(
        feedbacks
          .filter((f) => f.user_type === 'registered')
          .map((f) => f.user_id)
      ),
    ];

    // Split IDs into Mongo ObjectIds vs custom user_id strings to avoid cast errors
    const objectIdLike = registeredUserIds.filter((id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)).map((id) => new mongoose.Types.ObjectId(id));
    const customIds = registeredUserIds.filter((id) => !(typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)));

    const users = await User.find({
      $or: [
        objectIdLike.length ? { _id: { $in: objectIdLike } } : null,
        customIds.length ? { user_id: { $in: customIds } } : null,
      ].filter(Boolean),
    }).lean();

    const userByAnyId = new Map();
    for (const u of users) {
      userByAnyId.set(u._id.toString(), u);
      if (u.user_id) userByAnyId.set(u.user_id, u);
    }

    const result = feedbacks
      .map((f) => {
        // Guest
        if (f.user_type === 'guest' || (typeof f.user_id === 'string' && f.user_id.startsWith('GST'))) {
          return {
            ...f,
            user_info: {
              name: 'Guest User',
              user_id: (f.user_id || '').replace('GST', ''),
              type: 'guest',
              email: 'N/A',
            },
          };
        }
        // Registered
        const u = userByAnyId.get(f.user_id) || userByAnyId.get(f.user_id?.toString());
        if (!u) return null;
        return {
          ...f,
          user_info: {
            name: u.name,
            user_id: f.user_id,
            type: 'registered',
            email: u.email,
          },
        };
      })
      .filter(Boolean);

    return result;
  }

  // Fallback to file
  const data = readData();
  return data.feedbacks
    .map((f) => {
      if (f.user_type === 'guest' || (typeof f.user_id === 'string' && f.user_id.startsWith('GST'))) {
        return {
          ...f,
          user_info: {
            name: 'Guest User',
            user_id: f.user_id.replace('GST', ''),
            type: 'guest',
            email: 'N/A',
          },
        };
      }
      const user = data.users.find((u) => u._id === f.user_id || u.user_id === f.user_id);
      if (!user) return null;
      return {
        ...f,
        user_info: {
          name: user.name,
          user_id: f.user_id,
          type: 'registered',
          email: user.email,
        },
      };
    })
    .filter(Boolean);
};

// API: countUsers()
export const countUsers = async () => {
  if (isMongo()) {
    return await User.countDocuments({});
  }
  const data = readData();
  return data.users.length;
};