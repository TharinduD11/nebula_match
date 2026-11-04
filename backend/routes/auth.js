/**
 * Nebula Match — Authentication & Player Identity Routes
 * 
 * Provides:
 * - POST /api/auth/signup: Create new player account in MongoDB
 * - POST /api/auth/login: Authenticate existing player credentials
 * - GET /api/auth/profile/:identifier: Fetch player stats
 */

const express = require('express');
const router = express.Router();
const User = require('../database/models/User');
const mongoose = require('mongoose');

// Helper to check if MongoDB connection is ready
function isDBConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * POST /api/auth/signup
 * Register a new player account
 */
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are all required.'
      });
    }

    const cleanUsername = String(username).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      return res.status(400).json({
        success: false,
        message: 'Username must be between 3 and 20 characters.'
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Check MongoDB connection
    if (!isDBConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is currently offline. Please ensure MongoDB is started.'
      });
    }

    // Check duplicate username or email
    const existingUser = await User.findOne({
      $or: [{ username: cleanUsername }, { email: cleanEmail }]
    });

    if (existingUser) {
      if (existingUser.username.toLowerCase() === cleanUsername.toLowerCase()) {
        return res.status(409).json({
          success: false,
          message: `Username '${cleanUsername}' is already registered. Please choose another.`
        });
      }
      return res.status(409).json({
        success: false,
        message: `An account with email '${cleanEmail}' already exists. Please sign in instead.`
      });
    }

    // Hash password and persist user
    const hashedPassword = User.hashPassword(password);
    const newUser = await User.create({
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword
    });

    console.log(`[Auth API] New user registered: ${cleanUsername} (${cleanEmail})`);

    return res.status(201).json({
      success: true,
      message: `Account created successfully! Welcome, ${newUser.username}.`,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        bestScore: newUser.bestScore,
        gamesPlayed: newUser.gamesPlayed
      }
    });

  } catch (err) {
    console.error('[Auth API Error on Signup]:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Error occurred while creating user account.'
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate existing player
 */
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email or username and password are required.'
      });
    }

    const cleanId = String(identifier).trim();

    if (!isDBConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is currently offline. Please ensure MongoDB is running.'
      });
    }

    // Find user by either email or username
    const user = await User.findOne({
      $or: [
        { email: cleanId.toLowerCase() },
        { username: cleanId }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: `No account found for '${cleanId}'. Please check your credentials or Sign Up.`
      });
    }

    // Verify password
    const isMatch = User.verifyPassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please try again.'
      });
    }

    console.log(`[Auth API] User logged in successfully: ${user.username}`);

    return res.json({
      success: true,
      message: `Welcome back, ${user.username}!`,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        bestScore: user.bestScore,
        gamesPlayed: user.gamesPlayed
      }
    });

  } catch (err) {
    console.error('[Auth API Error on Login]:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Error occurred during login.'
    });
  }
});

/**
 * GET /api/auth/profile/:identifier
 * Fetch player profile & score statistics
 */
router.get('/profile/:identifier', async (req, res) => {
  try {
    const cleanId = String(req.params.identifier).trim();

    if (!isDBConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database offline.'
      });
    }

    const user = await User.findOne({
      $or: [
        { email: cleanId.toLowerCase() },
        { username: cleanId }
      ]
    }).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Player profile not found.'
      });
    }

    return res.json({
      success: true,
      user
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

module.exports = router;

