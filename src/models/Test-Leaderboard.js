const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
    entries: [
        {
            studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            score: { type: Number, required: true },
            correctAnswers: { type: Number, required: true },
            timeTaken: { type: Number, required: true }, // in seconds
            attemptedQuestions: { type: Number, required: true },
            rank: { type: Number, default: null } // Optional; can be updated after sorting
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('Test-Leaderboard', leaderboardSchema);
