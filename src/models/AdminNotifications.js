const mongoose = require("mongoose");

const AdminNotificationsSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      default: () =>
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      required: true,
    },
    date: {
      type: Date,
      default: Date.now, // Defaults to the current date and time
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // Adds `createdAt` and `updatedAt` fields automatically
  }
);

module.exports = mongoose.model("AdminNotifications", AdminNotificationsSchema);
