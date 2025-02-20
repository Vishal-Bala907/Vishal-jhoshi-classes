const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio: String,
  location: String,
  birthDate: Date,
  role: { type: String, default: "student" },
  progressId: { type: mongoose.Schema.Types.ObjectId, ref: "Progress" },
  studySessions: [
    { type: mongoose.Schema.Types.ObjectId, ref: "StudySession" },
  ],
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
  mentors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  tests: [{ type: mongoose.Schema.Types.ObjectId, ref: "Test" }],
  image_url: { type: String },
  seenBy: [{ type: String }], // Array of user IDs who have seen the message
});

module.exports = mongoose.model("User", userSchema);
