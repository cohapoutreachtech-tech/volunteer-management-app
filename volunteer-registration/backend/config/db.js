const mongoose = require('mongoose');

const {
  MONGO_USERNAME,
  MONGO_PASSWORD,
  MONGO_CLUSTER,
  CLUSTER_ID,
  MONGO_DB
} = process.env;

// Check for missing env vars and throw a clear error
if (!MONGO_USERNAME || !MONGO_PASSWORD || !MONGO_CLUSTER || !CLUSTER_ID || !MONGO_DB) {
  throw new Error('Missing one or more required MongoDB environment variables: MONGO_USERNAME, MONGO_PASSWORD, MONGO_CLUSTER, CLUSTER_ID, MONGO_DB');
}

// Format cluster name correctly - remove any special characters and ensure proper format
const formattedCluster = MONGO_CLUSTER
  ? MONGO_CLUSTER.trim().toLowerCase().replace('cluster', '').replace(/[^a-zA-Z0-9]/g, '')
  : '';

const uri = `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@cluster${formattedCluster}.${CLUSTER_ID}.mongodb.net/${MONGO_DB}?retryWrites=true&w=majority`;

const connectDB = async () => {
  console.log('API connecting to MongoDB URI:', uri.replace(MONGO_PASSWORD, '****'));
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      dbName: MONGO_DB
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;