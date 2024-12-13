const mongoose = require("mongoose");

const TestSessionSchema = new mongoose.Schema({
  liveTestId: {
    type: mongoose.Schema.Types.ObjectId, // Reference to the LiveTest
    required: true,
    ref: "LiveTest", // Referencing the LiveTest model
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId, // Reference to the Student
    required: true,
    ref: "User", // Referencing the Student model (if you have one)
  },
  startTime: {
    type: Date, // Date and time when the test starts
    required: true,
  },
  endTime: {
    type: Date, // Date and time when the test ends
    required: true,
  },
});

module.exports = mongoose.model("TestSession", TestSessionSchema);
