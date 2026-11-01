/**
 * Nebula Match — Health & System Status Route
 * 
 * Provides runtime information about:
 * - Server status
 * - Uptime
 * - MongoDB connection state
 */

const express = require('express');
const router = express.Router();
const { getConnectionStatus } = require('../database/connection');

/**
 * @route   GET /api/health
 * @desc    Get backend service and database health status
 * @access  Public
 */
router.get('/', (req, res) => {
  const dbStatus = getConnectionStatus();

  res.status(200).json({
    success: true,
    service: 'Nebula Match Backend API',
    stage: 'Stage 3: MongoDB Setup & Backend Initialization',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus.status,
      connected: dbStatus.stateCode === 1,
      host: dbStatus.host,
      name: dbStatus.database
    }
  });
});

module.exports = router;

