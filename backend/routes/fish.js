/**
 * Nebula Match — Fish Game API Routes
 * 
 * Endpoints:
 * - GET /api/fish/challenge : Fetch a new fish counting puzzle
 * - POST /api/fish/verify   : Validate user solution & award bonus time
 */

const express = require('express');
const router = express.Router();
const { getFishChallenge, verifyFishAnswer } = require('../services/fishService');

// GET /api/fish/challenge
router.get('/challenge', async (req, res) => {
  try {
    const puzzle = await getFishChallenge();
    res.json({
      success: true,
      question: puzzle.question,
      solution: puzzle.solution,
      source: puzzle.source,
      message: 'Quest is ready.'
    });
  } catch (err) {
    console.error('[Fish API Error]', err);
    res.status(500).json({
      success: false,
      message: 'Failed to generate Fish Game challenge.'
    });
  }
});

// POST /api/fish/verify
router.post('/verify', (req, res) => {
  try {
    const { answer, solution } = req.body;
    
    if (answer === undefined || solution === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Both answer and solution must be provided.'
      });
    }

    const isCorrect = verifyFishAnswer(answer, solution);
    res.json({
      success: true,
      correct: isCorrect,
      bonusSeconds: isCorrect ? 15 : 0,
      message: isCorrect 
        ? '✓ Correct! +15 bonus seconds awarded to chronometer.' 
        : '✕ Calculation mismatch. Incorrect number of fish.'
    });
  } catch (err) {
    console.error('[Fish Verify Error]', err);
    res.status(500).json({
      success: false,
      message: 'Failed to verify solution.'
    });
  }
});

module.exports = router;

