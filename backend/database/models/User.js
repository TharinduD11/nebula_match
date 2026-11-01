/**
 * Nebula Match — User / Explorer Mongoose Model
 * 
 * Demonstrates:
 * - Virtual Identity: represents the authenticated player identity.
 * - Schema validation: ensures data integrity for usernames and emails.
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Explorer call sign (username) is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Call sign must be at least 3 characters'],
      maxlength: [20, 'Call sign cannot exceed 20 characters'],
      match: [/^[a-zA-Z0-9_-]+$/, 'Call sign may only contain letters, numbers, hyphens, and underscores']
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters']
    },
    // Game stats linked to virtual identity
    bestScore: {
      type: Number,
      default: 0,
      min: 0
    },
    gamesPlayed: {
      type: Number,
      default: 0,
      min: 0
    },
    totalBonusTimeEarned: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

// Prevent model re-compilation in case of multiple imports/watch restarts
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;

