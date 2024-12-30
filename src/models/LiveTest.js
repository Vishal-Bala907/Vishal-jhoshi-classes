const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  questionType: { type: String, required: true },
  subject: { type: String, required: true },
});

const LiveTestSchema = new mongoose.Schema({
  testName: { type: String, required: true },
  description: { type: String, required: true },
  timeDuration: { type: Number, required: true },
  time: { type: String, required: true },
  date: { type: Date, required: true },
  category: { type: String, required: true },
  instructions: { type: String, required: true },
  positiveMarking: { type: Number, required: true },
  negativeMarking: { type: Number, required: true },
  timestamp: { type: Number, required: true },
  Questions: [QuestionSchema], // Array of question objects
  canAttempt: {
    type: Boolean,
    required: true,
    default: false,
  },
});

module.exports = mongoose.model("LiveTest", LiveTestSchema);

// module.exports = mongoose.model("Room", roomSchema);
