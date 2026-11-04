/**
 * Nebula Match — Score / Leaderboard Mongoose Model
 * 
 * Represents persistent gameplay performance records in MongoDB.
 */

const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema(
  {
    callsign: {
      type: String,
      required: [true, 'Player callsign (name) is required'],
      trim: true,
      maxlength: [24, 'Callsign cannot exceed 24 characters']
    },
    score: {
      type: Number,
      required: [true, 'Score is required'],
      min: 0
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    difficultyName: {
      type: String,
      default: 'Medium'
    },
    accuracy: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    },
    timeRemaining: {
      type: Number,
      default: 0
    },
    moves: {
      type: Number,
      default: 0
    },
    pairsMatched: {
      type: Number,
      default: 0
    },
    bonusTimeClaimed: {
      type: Number,
      default: 0
    },
    displayDate: {
      type: String,
      default: () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  },
  {
    timestamps: true
  }
);

// Index score descending for fast leaderboard queries
scoreSchema.index({ score: -1 });
scoreSchema.index({ difficulty: 1, score: -1 });

const Score = mongoose.models.Score || mongoose.model('Score', scoreSchema);

module.exports = Score;

