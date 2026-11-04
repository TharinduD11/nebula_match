/**
 * Nebula Match — User / Explorer Mongoose Model
 * 
 * Demonstrates:
 * - Virtual Identity: represents the authenticated player identity.
 * - Schema validation: ensures data integrity for usernames and emails.
 * - Password hashing with secure cryptographic salt.
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Explorer username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [20, 'Username cannot exceed 20 characters'],
      match: [/^[a-zA-Z0-9_-]+$/, 'Username may only contain letters, numbers, hyphens, and underscores']
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

// Method to hash password before saving
userSchema.statics.hashPassword = function (plainPassword) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(plainPassword, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

// Method to verify password
userSchema.statics.verifyPassword = function (plainPassword, storedHash) {
  if (!storedHash || !storedHash.includes(':')) {
    // Fallback for unhashed legacy passwords
    return plainPassword === storedHash;
  }
  const [salt, originalHash] = storedHash.split(':');
  const hash = crypto.pbkdf2Sync(plainPassword, salt, 1000, 64, 'sha512').toString('hex');
  return hash === originalHash;
};

// Prevent model re-compilation in case of multiple imports/watch restarts
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
