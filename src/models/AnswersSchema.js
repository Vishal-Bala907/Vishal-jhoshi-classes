const mongoose = require("mongoose");

const AnswersSchema = new mongoose.Schema({
  questionIndex: {
    type: Number,
    required: true,
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId, // Refers to another document
    ref: "Question",
    required: true,
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId, // Refers to another document
    ref: "Test",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Refers to another document
    ref: "User",
    required: true,
  },
  userAnswer: {
    type: [mongoose.Schema.Types.Mixed], // Can store an array of any type (e.g., chars or objects)
    required: true,
  },
  rightAnswer: {
    type: [mongoose.Schema.Types.Mixed], // Same flexibility as `userAnswer`
    required: true,
  },
  questionStatus: {
    type: String,
    enum: ["CORRECT", "INCORRECT", "INIT"],
    required: true,
  },
  marks: {
    type: Number,
    required: true,
    default: 0,
  },
  subject: {
    type: String,
    require: true,
  },
  type: {
    type: String,
    required: true,
  },
  timeTaken: {
    type: String,
    required: true,
  },
});

// Export the schema
module.exports = mongoose.model("Answers", AnswersSchema);
