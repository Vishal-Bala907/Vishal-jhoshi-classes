const mongoose = require("mongoose");

// Define the session schema
const sessionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["ACTIVE", "INACTIVE", "TAKEN", "CANCLED"],
    default: "INACTIVE",
  },
  date: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String,
    required: false,
  },
  endTime: {
    type: String,
    required: false,
  },
});

// // Update the `updatedAt` field before saving
// sessionSchema.pre("save", function (next) {
//   this.updatedAt = Date.now();
//   next();
// });

// Create the model
const Session = mongoose.model("Session", sessionSchema);

module.exports = Session;
