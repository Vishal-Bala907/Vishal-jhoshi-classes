const mongoose = require("mongoose");

const TestQuestionSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
    enum: ["physics", "chemistry", "maths", "biology"], // Only allow specific subjects
  },
  topic: {
    type: String,
    required: true,
  },
  subtopic: {
    type: String,
  },
  level: {
    type: String,
    required: true,
    enum: ["easy", "intermediate", "hard"], // Ensure predefined levels
  },
  type: {
    type: String,
    required: true,
    enum: ["integer"], // Specific question types
  },
  description: {
    type: String,
    required: true,
  },
  correctAnswer: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("TestQuestion", TestQuestionSchema);
