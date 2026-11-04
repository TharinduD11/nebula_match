/**
 * Nebula Match — Leaderboard API Routes
 * 
 * Provides:
 * - GET /api/leaderboard: Fetch ranked scores with optional difficulty filter
 * - POST /api/leaderboard: Submit and persist a new game score to MongoDB
 * - DELETE /api/leaderboard/reset: Reset leaderboard to seed data
 */

const express = require('express');
const router = express.Router();
const Score = require('../database/models/Score');
const User = require('../database/models/User');
const mongoose = require('mongoose');

// Default space pioneer historical records to seed if database is empty
const DEFAULT_SEEDS = [
  {
    callsign: 'Neil_Armstrong',
    score: 2180,
    difficulty: 'hard',
    difficultyName: 'Hard',
    accuracy: 94,
    timeRemaining: 14,
    moves: 12,
    pairsMatched: 10,
    bonusTimeClaimed: 15,
    displayDate: 'Oct 28, 2026'
  },
  {
    callsign: 'Valentina_Tereshkova',
    score: 1890,
    difficulty: 'medium',
    difficultyName: 'Medium',
    accuracy: 91,
    timeRemaining: 21,
    moves: 14,
    pairsMatched: 8,
    bonusTimeClaimed: 15,
    displayDate: 'Oct 29, 2026'
  },
  {
    callsign: 'Carl_Sagan',
    score: 1740,
    difficulty: 'hard',
    difficultyName: 'Hard',
    accuracy: 86,
    timeRemaining: 9,
    moves: 16,
    pairsMatched: 10,
    bonusTimeClaimed: 0,
    displayDate: 'Oct 30, 2026'
  },
  {
    callsign: 'Mae_Jemison',
    score: 1560,
    difficulty: 'medium',
    difficultyName: 'Medium',
    accuracy: 88,
    timeRemaining: 18,
    moves: 15,
    pairsMatched: 8,
    bonusTimeClaimed: 15,
    displayDate: 'Oct 31, 2026'
  },
  {
    callsign: 'Yuri_Gagarin',
    score: 1420,
    difficulty: 'easy',
    difficultyName: 'Easy',
    accuracy: 95,
    timeRemaining: 32,
    moves: 8,
    pairsMatched: 6,
    bonusTimeClaimed: 0,
    displayDate: 'Nov 01, 2026'
  }
];

function isDBConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * GET /api/leaderboard
 * Fetch sorted leaderboard entries from MongoDB
 */
router.get('/', async (req, res) => {
  try {
    if (!isDBConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is currently offline. Serving fallback records.',
        data: DEFAULT_SEEDS
      });
    }

    const { difficulty } = req.query;
    const filter = {};
    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty.toLowerCase())) {
      filter.difficulty = difficulty.toLowerCase();
    }

    // Check count and seed initial records if empty
    const totalCount = await Score.countDocuments();
    if (totalCount === 0) {
      await Score.insertMany(DEFAULT_SEEDS);
      console.log('[Leaderboard API] Initial default scores seeded into MongoDB.');
    }

    const scores = await Score.find(filter)
      .sort({ score: -1, createdAt: -1 })
      .limit(50)
      .lean();

    return res.json({
      success: true,
      count: scores.length,
      data: scores
    });

  } catch (err) {
    console.error('[Leaderboard API Error]:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Error fetching leaderboard from database.'
    });
  }
});

/**
 * POST /api/leaderboard
 * Save a new player score to MongoDB
 */
router.post('/', async (req, res) => {
  try {
    if (!isDBConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is offline. Could not persist score to MongoDB.'
      });
    }

    const {
      callsign,
      score,
      difficulty,
      difficultyName,
      accuracy,
      timeRemaining,
      moves,
      pairsMatched,
      bonusTimeClaimed
    } = req.body;

    const safeCallsign = String(callsign || 'Anonymous Player').trim();
    const safeScore = Math.max(0, Number(score) || 0);
    const safeDiff = ['easy', 'medium', 'hard'].includes(String(difficulty).toLowerCase())
      ? String(difficulty).toLowerCase()
      : 'medium';

    const newScore = await Score.create({
      callsign: safeCallsign,
      score: safeScore,
      difficulty: safeDiff,
      difficultyName: difficultyName || (safeDiff.charAt(0).toUpperCase() + safeDiff.slice(1)),
      accuracy: Math.min(100, Math.max(0, Number(accuracy) || 100)),
      timeRemaining: Math.max(0, Number(timeRemaining) || 0),
      moves: Math.max(0, Number(moves) || 0),
      pairsMatched: Math.max(0, Number(pairsMatched) || 0),
      bonusTimeClaimed: Math.max(0, Number(bonusTimeClaimed) || 0),
      displayDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    });

    console.log(`[Leaderboard API] Saved score to MongoDB: ${safeCallsign} - ${safeScore} pts (${safeDiff})`);

    // If matching User exists, update user performance stats
    try {
      const user = await User.findOne({ username: safeCallsign });
      if (user) {
        user.gamesPlayed = (user.gamesPlayed || 0) + 1;
        if (safeScore > (user.bestScore || 0)) {
          user.bestScore = safeScore;
        }
        if (bonusTimeClaimed) {
          user.totalBonusTimeEarned = (user.totalBonusTimeEarned || 0) + Number(bonusTimeClaimed);
        }
        await user.save();
        console.log(`[Leaderboard API] Updated user record stats for: ${safeCallsign}`);
      }
    } catch (userErr) {
      // Non-blocking catch
    }

    return res.status(201).json({
      success: true,
      message: 'Score successfully saved to MongoDB database.',
      data: newScore
    });

  } catch (err) {
    console.error('[Leaderboard API Error on Save]:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Error saving score to database.'
    });
  }
});

/**
 * DELETE /api/leaderboard/reset
 * Reset leaderboard to default pioneer seed records
 */
router.delete('/reset', async (req, res) => {
  try {
    if (!isDBConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is offline.'
      });
    }

    await Score.deleteMany({});
    await Score.insertMany(DEFAULT_SEEDS);

    return res.json({
      success: true,
      message: 'Leaderboard records successfully reset to default pioneer seed in MongoDB.'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

module.exports = router;

