/**
 * Nebula Match — Leaderboard API Routes
 * 
 * Provides:
 * - GET /api/leaderboard: Fetch the signed-in player's scores with optional difficulty filter
 * - POST /api/leaderboard: Submit and persist a new game score to MongoDB
 */

const express = require('express');
const router = express.Router();
const Score = require('../database/models/Score');
const User = require('../database/models/User');
const mongoose = require('mongoose');

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
        message: 'Database is currently offline.',
        data: []
      });
    }

    const ownerUsername = String(req.query.username || '').trim();
    if (!ownerUsername) {
      return res.status(400).json({ success: false, message: 'Username is required.' });
    }

    const { difficulty } = req.query;
    const filter = {
      $or: [
        { ownerUsername },
        // Include scores saved before score ownership was added, but never expose other users' scores.
        { ownerUsername: { $exists: false }, callsign: ownerUsername }
      ]
    };
    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty.toLowerCase())) {
      filter.difficulty = difficulty.toLowerCase();
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
      ownerUsername,
      callsign,
      outcome,
      score,
      difficulty,
      difficultyName,
      accuracy,
      timeRemaining,
      moves,
      pairsMatched,
      bonusTimeClaimed
    } = req.body;

    const safeOwnerUsername = String(ownerUsername || '').trim();
    if (!safeOwnerUsername) {
      return res.status(400).json({ success: false, message: 'Score owner is required.' });
    }

    const safeCallsign = String(callsign || 'Anonymous Player').trim();
    const safeOutcome = outcome === 'win' || outcome === 'victory' ? 'win' : 'lose';
    const safeScore = Math.max(0, Number(score) || 0);
    const safeDiff = ['easy', 'medium', 'hard'].includes(String(difficulty).toLowerCase())
      ? String(difficulty).toLowerCase()
      : 'medium';

    const newScore = await Score.create({
      ownerUsername: safeOwnerUsername,
      callsign: safeCallsign,
      outcome: safeOutcome,
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
      const user = await User.findOne({ username: safeOwnerUsername });
      if (user) {
        user.gamesPlayed = (user.gamesPlayed || 0) + 1;
        if (safeScore > (user.bestScore || 0)) {
          user.bestScore = safeScore;
        }
        if (bonusTimeClaimed) {
          user.totalBonusTimeEarned = (user.totalBonusTimeEarned || 0) + Number(bonusTimeClaimed);
        }
        await user.save();
        console.log(`[Leaderboard API] Updated user record stats for: ${safeOwnerUsername}`);
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

module.exports = router;

