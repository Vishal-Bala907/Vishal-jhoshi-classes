const mongoose = require("mongoose");

const leaderboardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Assuming userId references a User collection
    required: true,
    ref: "User",
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId, // Assuming testId references a Test collection
    required: true,
    ref: "Test",
  },
  correctCount: {
    type: Number,
    required: true,
    default: 0,
  },
  incorrectCount: {
    type: Number,
    required: true,
    default: 0,
  },
  unansweredCount: {
    type: Number,
    required: true,
    default: 0,
  },
  accuracy: {
    type: Number,
    required: true,
    default: 0, // Represented as a percentage (e.g., 85.5)
  },
  totalTimeTaken: {
    type: Number,
    required: true,
    default: 0, // Total time in seconds
  },
  averageTimePerQuestion: {
    type: Number,
    required: true,
    default: 0, // Average time per question in seconds
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  mark: {
    type: Number,
    default: 0,
  },
  obtainedMarks: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("TestLeaderboard", leaderboardSchema);
