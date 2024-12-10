const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
    option: { type: String, required: true },
    image_url: { type: String },
    isCorrect: { type: Boolean, default: false }
});

const questionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    subject: { type: String },
    difficulty: { type: String },
    formula: { type: String },
    image_url: { type: String },
    question_type: { type: String, default: "multi_select" },
    options: {
        type: [optionSchema],
        validate: [arrayLimit, '{PATH} must have at least one option']
    }
});

const testSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    test_type: { type: String },
    count: { type: Number, default: 0 },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    questions: {
        type: [questionSchema],
        validate: [arrayLimit, '{PATH} must have at least one question']
    }
});

// Validation function to ensure arrays have at least one item
function arrayLimit(val) {
    return val.length > 0;
}

module.exports = mongoose.model('Test', testSchema);
