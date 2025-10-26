require('dotenv').config();

const { MONGO_USERNAME, MONGO_PASSWORD, MONGO_CLUSTER, CLUSTER_ID, MONGO_DB } = process.env;

// Validate environment variables
if (!MONGO_USERNAME || !MONGO_PASSWORD || !MONGO_CLUSTER) {
  throw new Error('Missing required MongoDB environment variables');
}

// Format cluster name correctly - remove any special characters and ensure proper format
const formattedCluster = MONGO_CLUSTER.trim().toLowerCase()
  .replace('cluster', '')  // Remove 'cluster' if present
  .replace(/[^a-zA-Z0-9]/g, ''); // Remove special characters

const config = {
  mongoURI: `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@cluster${formattedCluster}.${CLUSTER_ID}.mongodb.net/${MONGO_DB}?retryWrites=true&w=majority`,
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    dbName: 'cohap' // explicitly set database name
  }
};

console.log('MongoDB URI format:', config.mongoURI.replace(MONGO_PASSWORD, '****'));

module.exports = config;
