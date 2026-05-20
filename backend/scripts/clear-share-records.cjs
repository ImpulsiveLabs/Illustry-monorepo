#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
const explicitlyAllowed = process.env.ALLOW_SHARE_RECORD_CLEANUP === 'true';

if (isProduction && !explicitlyAllowed) {
  throw new Error('Refusing to clear share records in production without ALLOW_SHARE_RECORD_CLEANUP=true');
}

const mongoUrl = process.env.MONGO_URL
  || process.env.MONGODB_URI
  || process.env.MONGO_TEST_URL
  || 'mongodb://localhost:27017/illustry';

const auth = process.env.MONGO_USER && process.env.MONGO_PASSWORD
  ? {
    user: process.env.MONGO_USER,
    pass: process.env.MONGO_PASSWORD
  }
  : {};

const clearShareRecords = async () => {
  await mongoose.connect(mongoUrl, auth);

  const [dashboardResult, visualizationResult] = await Promise.all([
    mongoose.connection.collection('dashboards').updateMany(
      {
        $or: [
          { shareId: { $exists: true } },
          { sharedWith: { $exists: true, $ne: [] } }
        ]
      },
      {
        $unset: { shareId: '' },
        $set: { sharedWith: [] }
      }
    ),
    mongoose.connection.collection('visualizations').updateMany(
      {
        $or: [
          { shareId: { $exists: true } },
          { sharedWith: { $exists: true, $ne: [] } }
        ]
      },
      {
        $unset: { shareId: '' },
        $set: { sharedWith: [] }
      }
    )
  ]);

  console.log(`Cleared dashboard share records on ${dashboardResult.modifiedCount || 0} documents.`);
  console.log(`Cleared visualization share records on ${visualizationResult.modifiedCount || 0} documents.`);
};

clearShareRecords()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => undefined);
  });
