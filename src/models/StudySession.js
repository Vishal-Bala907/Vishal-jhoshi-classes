const mongoose = require('mongoose')
const studySessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    duration: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('StudySession', studySessionSchema);
