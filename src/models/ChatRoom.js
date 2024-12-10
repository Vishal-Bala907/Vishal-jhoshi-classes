const mongoose = require("mongoose");
const Message = require("./Message"); // Import the Message model

const roomSchema = new mongoose.Schema({
  firstRoom: { type: String, required: true },
  secondRoom: { type: String, required: true },
  firstUser: { type: String },
  secondUser: { type: String },
  chats: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }], // Reference to Message model
});

module.exports = mongoose.model("Room", roomSchema);
