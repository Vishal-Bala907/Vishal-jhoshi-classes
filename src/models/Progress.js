const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
    test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
    totalQuestions: { type: Number, required: true },
    correctCount: { type: Number, required: true },
    wrongCount: { type: Number, required: true },
    score: { type: Number, required: true },
    dateTaken: { type: Date, default: Date.now },
    correctAnswers: [{
        questionText: String,
        timeTaken: Number,
        userAnswer: String,
        correctAnswer: String
    }],
    wrongAnswers: [{
        questionText: String,
        userAnswer: String,
        timeTaken: Number,
        correctAnswer: String
    }],
    attemptedQuestionIndexes: [{ type: Number }],
    attemptedQuestionCount: { type: Number },
    timeTaken: Number,
    totalScore: Number,
    correctAnswerIndexes: [{ type: Number }],
    userAnswers: [{ type: mongoose.Schema.Types.Mixed }],
    subjectScores: [{
        subject: String,
        score: Number
    }]
});


const progressSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coursesCompleted: [{ type: String }],
    scores: [{
        course: String,
        score: Number
    }],
    testResults: [testResultSchema],
    overallScore: { type: Number, default: 0 },
    dateCreated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Progress', progressSchema);
