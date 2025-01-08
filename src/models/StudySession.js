const mongoose = require("mongoose");
const studySessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subject: { type: String, required: true },
    date: { type: Date, require: true },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    duration: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudySession", studySessionSchema);
