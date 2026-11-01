/**
 * Nebula Match — MongoDB Connection Manager
 * 
 * Demonstrates:
 * - High cohesion: encapsulates all database connection lifecycle logic.
 * - Low coupling: exports a clean interface (connectDB, getConnectionStatus).
 * - Event-driven programming: hooks into Mongoose connection events.
 */

const mongoose = require('mongoose');

// Default fallback connection string
const DEFAULT_MONGODB_URI = 'mongodb://127.0.0.1:27017/nebula_match';

// Connection event listeners (Event-Driven Architecture)
mongoose.connection.on('connected', () => {
  console.log('[Database Event] Connected to MongoDB successfully.');
});

mongoose.connection.on('error', (err) => {
  console.error('[Database Event] MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('[Database Event] MongoDB disconnected.');
});

/**
 * Returns human-readable connection status.
 * 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
 */
function getConnectionStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  const stateCode = mongoose.connection.readyState;
  return {
    stateCode,
    status: states[stateCode] || 'unknown',
    database: mongoose.connection.name || null,
    host: mongoose.connection.host || null
  };
}

/**
 * Establishes MongoDB connection using Mongoose.
 * Non-blocking: logs instructions if MongoDB is unreachable so Express server continues running.
 * 
 * @param {string} [uri] Optional MongoDB URI override
 * @returns {Promise<typeof mongoose | null>}
 */
async function connectDB(uri) {
  const connectionString = uri || process.env.MONGODB_URI || DEFAULT_MONGODB_URI;

  try {
    console.log(`[Database] Connecting to MongoDB at: ${connectionString.replace(/\/\/[^@]+@/, '//***:***@')}...`);
    
    // Mongoose 8+ default options are optimized (strictQuery enabled, modern URL parser)
    await mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 5000 // 5-second timeout for local responsiveness
    });

    return mongoose;
  } catch (err) {
    console.warn('\n' + '='.repeat(70));
    console.warn('[Database Notice] Could not connect to MongoDB server.');
    console.warn(`Reason: ${err.message}`);
    console.warn('The Express server will continue running in offline database mode.');
    console.warn('To enable persistent data, start your local MongoDB daemon:');
    console.warn('   brew services start mongodb-community (macOS)');
    console.warn('Or configure a remote MongoDB Atlas URI in backend/.env:');
    console.warn('   MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/nebula_match');
    console.warn('='.repeat(70) + '\n');
    return null;
  }
}

/**
 * Graceful database disconnect for application shutdown.
 */
async function disconnectDB() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('[Database] Mongoose disconnected through app termination.');
    }
  } catch (err) {
    console.error('[Database] Error during disconnect:', err.message);
  }
}

module.exports = {
  connectDB,
  disconnectDB,
  getConnectionStatus
};

