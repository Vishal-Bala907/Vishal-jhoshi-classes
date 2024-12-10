const mongoose = require("mongoose");
const ChatRoom = require("../../models/ChatRoom");
const Message = require("../../models/Message");

const saveMessage = async (message) => {
  console.log(message);
  const senderId = message.sender;
  const recipientId = message.recipient;

  const firstId = `${senderId}_${recipientId}`;
  const secondId = `${recipientId}_${senderId}`;

  try {
    // Check for chats in the first room ID
    let room = await ChatRoom.findOne({
      $or: [{ firstRoom: firstId }, { secondRoom: secondId }],
    });
    console.log("ROOM NOT FOUND");
    if (!room) {
      // If not found, check for chats in the second room ID
      room = await ChatRoom.findOne({
        $or: [{ firstRoom: secondId }, { secondRoom: firstId }],
      });
    }

    const newMessage = await saveMessageInDb(message);
    if (!newMessage) {
      throw new Error("Message could not be saved");
    }

    if (room) {
      room.chats.push(newMessage._id); // Use only the message's ObjectId
      await room.save();
    } else {
      // Create a new room if none exists
      const newRoom = new ChatRoom({
        firstRoom: firstId,
        secondRoom: secondId,
        firstUser: senderId,
        secondUser: recipientId,
        chats: [newMessage._id],
      });

      await newRoom.save();
    }
  } catch (error) {
    console.error("Error in saveMessage:", error);
  }
};

const saveMessageInDb = async (message) => {
  try {
    // Example sender and recipient details (you can replace with actual user IDs)
    const senderId = message.sender; // Example sender ID
    const recipientId = message.recipient; // Example recipient ID

    const newMessage = new Message({
      sender: senderId,
      senderName: message.senderName, // Replace with the sender's actual name
      recipient: recipientId,
      recipientName: message.recipientName, // Replace with the recipient's actual name
      message: message.message,
      timestamp: message.timestamp, // Current timestamp
    });

    console.log("saving in the database");
    await newMessage.save();
    // console.log("Message saved successfully:", newMessage);

    return newMessage;
  } catch (error) {
    console.error("Error saving message:", error);
    return null;
  }
};

const saveMessageInExistingRoom = async () => {};

module.exports.saveMessage = saveMessage;
