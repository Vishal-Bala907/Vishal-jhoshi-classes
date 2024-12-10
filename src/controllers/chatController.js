const Message = require("../models/Message");

const mongoose = require("mongoose");
const ChatRoom = require("../models/ChatRoom");
// const Message = require("../../models/Message");

exports.userChats = async (req, res) => {
  const { userId, selectedUser } = req.params;

  // const senderId = userId;
  // const recipientId = selectedUser;

  const firstRoomId = `${userId}_${selectedUser}`;
  const secondRoomId = `${selectedUser}_${userId}`;

  console.log(firstRoomId);
  console.log(secondRoomId);

  try {
    // Check for chats in the first room ID
    let room = await ChatRoom.findOne({
      $or: [{ firstRoom: firstRoomId }, { secondRoom: secondRoomId }],
    }).populate("chats");
    if (!room) {
      // If not found, check for chats in the second room ID
      room = await ChatRoom.findOne({
        $or: [{ firstRoom: secondRoomId }, { secondRoom: firstRoomId }],
      }).populate("chats");
    }

    // console.log(room);
    if (room) {
      // console.log("no room");
      // console.log(room);
      return res.status(200).json(room.chats);
    } else {
      // If no room found, return a 404 response
      console.log("no room");
      return res
        .status(404)
        .json({ message: "No chats found between the users." });
    }
  } catch (error) {
    console.error("Error fetching chats: ", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.chatUserList = async (req, res) => {
  try {
    // Find distinct users who have either sent messages to or received messages from the current user
    const chatUsers = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: req.user.id }, { recipient: req.user.id }],
        },
      },
      {
        $project: {
          user: {
            $cond: {
              if: { $eq: ["$sender", req.user.id] },
              then: "$recipient",
              else: "$sender",
            },
          },
        },
      },
      {
        $group: {
          _id: "$user",
        },
      },
    ]);

    // Extract the user IDs from the aggregation result
    const userIds = chatUsers.map((user) => user._id);

    res.json({ chatUsers: userIds });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
