const leaderboardSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    subject: { type: String, required: true },
    topStudents: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        totalStudyTime: { type: Number }
    }]
});

module.exports = mongoose.model('Leaderboard', leaderboardSchema);
