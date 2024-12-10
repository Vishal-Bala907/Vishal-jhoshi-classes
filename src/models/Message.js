const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: { type: String, ref: "User", required: true },
  senderName: { type: String, required: true }, // Sender's name
  recipient: { type: String, ref: "User", required: true },
  recipientName: { type: String, required: true }, // Recipient's name
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", messageSchema);
