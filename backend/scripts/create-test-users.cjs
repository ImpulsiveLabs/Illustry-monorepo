/* eslint-disable no-console */
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

const argon2 = require('argon2');
const mongoose = require('mongoose');

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.MONGO_DB_NAME || 'illustry';
const PASSWORD = process.env.TEST_USERS_PASSWORD || 'IllustryTest123!';
const allowLocalMongo = process.env.ALLOW_LOCAL_MONGO_PROVISIONING === '1';

const normalizeEmail = (email) => email.trim().toLowerCase();

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true },
    emailNormalized: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    isEmailVerified: { type: Boolean, required: true, default: true },
    roles: { type: [String], required: true, default: ['user'] },
    authVersion: { type: Number, required: true, default: 0 }
  },
  { timestamps: true }
);
userSchema.index({ emailNormalized: 1 }, { unique: true, background: true });

const projectSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: false, default: '' },
  isActive: { type: Boolean, required: false, default: false },
  createdAt: { type: Date, required: false },
  updatedAt: { type: Date, required: false }
});
projectSchema.index({ userId: 1, name: 1 }, { unique: true, background: true });

const users = [
  { email: 'testuser1@illustry.local', name: 'Illustry Test User 1' },
  { email: 'testuser2@illustry.local', name: 'Illustry Test User 2' }
];

const validateConfig = () => {
  if (!MONGO_URL) {
    throw new Error('MONGO_URL is required. Set it to your MongoDB Atlas connection string before provisioning.');
  }

  const isLocalMongo = /mongodb:\/\/(localhost|127\.0\.0\.1|mongo)(:|\/)/i.test(MONGO_URL);
  if (isLocalMongo && !allowLocalMongo) {
    throw new Error(
      'Refusing to provision local MongoDB. Use MongoDB Atlas in MONGO_URL, or set ALLOW_LOCAL_MONGO_PROVISIONING=1 for explicit local development.'
    );
  }
};

const main = async () => {
  validateConfig();
  console.log(`Connecting to MongoDB database "${DB_NAME}" for test user provisioning...`);
  await mongoose.connect(MONGO_URL, {
    dbName: DB_NAME,
    connectTimeoutMS: Number(process.env.MONGO_CONNECT_TIMEOUT_MS || 300),
    serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 300),
    socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS || 300)
  });
  const User = mongoose.model('AuthUser', userSchema);
  const Project = mongoose.model('Project', projectSchema);
  const passwordHash = await argon2.hash(PASSWORD, { type: argon2.argon2id });

  for (const user of users) {
    const emailNormalized = normalizeEmail(user.email);
    const storedUser = await User.findOneAndUpdate(
      { emailNormalized },
      {
        $set: {
          email: user.email,
          emailNormalized,
          name: user.name,
          passwordHash,
          isEmailVerified: true,
          roles: ['user'],
          authVersion: 0
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();

    await Project.findOneAndUpdate(
      { userId: storedUser._id.toString(), name: 'Test Project' },
      {
        $set: {
          userId: storedUser._id.toString(),
          name: 'Test Project',
          description: 'Default project for local sharing tests',
          isActive: true,
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();
    console.log(`Provisioned ${user.email} with active project "Test Project"`);
  }

  console.log('Created verified local test users:');
  users.forEach((user) => console.log(`- ${user.email} / ${PASSWORD}`));
  await mongoose.disconnect();
};

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
