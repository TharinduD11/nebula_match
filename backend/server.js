/**
 * Nebula Match — Express Backend Server
 * 
 * Main entry point for the backend service.
 * Handles:
 * - Environment configuration
 * - Middleware orchestration
 * - Database connection
 * - API routing and static frontend serving
 * - Graceful process termination
 */

const path = require('path');
// Load environment variables from backend/.env if present
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const { connectDB, disconnectDB } = require('./database/connection');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 4000;

// --- Middlewares ---

// Cross-Origin Resource Sharing
app.use(cors({
  origin: '*', // Allow all origins during development
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Lightweight request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Serve frontend static assets directly from ../frontend
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// --- API Routes ---
app.use('/api/health', require('./routes/health'));
app.use('/api/fish', require('./routes/fish'));

// Root path handler: serves the Home page (index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// 404 Route Handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route ${req.originalUrl} not found.`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error occurred.'
  });
});

// --- Server Startup & Database Connection ---
let server;

async function startServer() {
  // Connect to MongoDB
  await connectDB();

  // Start HTTP Listener
  server = app.listen(PORT, () => {
    console.log('\n' + '★'.repeat(50));
    console.log(`  NEBULA MATCH BACKEND INITIALIZED`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  Local Server: http://localhost:${PORT}`);
    console.log(`  Health Check: http://localhost:${PORT}/api/health`);
    console.log(`  Frontend App: http://localhost:${PORT}/login.html`);
    console.log('★'.repeat(50) + '\n');
  });

  return server;
}

// Graceful Shutdown Handlers
async function handleShutdown(signal) {
  console.log(`\n[Process] Received ${signal}. Initiating graceful shutdown...`);
  
  if (server) {
    server.close(() => {
      console.log('[HTTP] Server stopped accepting new connections.');
    });
  }

  await disconnectDB();
  console.log('[Process] Cleanup complete. Exiting.');
  process.exit(0);
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

// Start server if run directly
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
