const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const multer = require("multer");
const path = require("path");

// Route Imports
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const chatRoutes = require("./routes/chatRoutes");
const testRoutes = require("./routes/testRoutes");
const rolesRoutes = require("./routes/roles");
const sessionRoutes = require("./routes/classSession");

// Socket.IO imports
const http = require("http");
const { Server } = require("socket.io");
const Message = require("./models/Message");

const { saveMessage } = require("./helpers/functions/SaveMessages");

// Initialize Express app
const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "20mb" })); // Set limit to 10MB
app.use(bodyParser.urlencoded({ limit: "20mb", extended: true })); // For form data
// Define the path to the images folder outside the `src` directory
// Folder to store uploaded images
const IMAGE_FOLDER = path.join(__dirname, "../uploads", "test", "images");
// Serve the images folder
app.use("/images", express.static(IMAGE_FOLDER));
// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.get("/", (req, res) => res.send("Welcome to the admin"));

app.use("/api/auth", authRoutes);
app.use(
  "/api/v1",
  userRoutes,
  chatRoutes,
  testRoutes,
  rolesRoutes,
  sessionRoutes
);

// Create HTTP server and initialize Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Adjust to your frontend URL
    methods: ["GET", "POST"],
  },
});

// Socket.IO Middleware for Authentication
// io.use((socket, next) => {
//   const token = socket.handshake.auth.token;
//   if (!token) {
//     console.error("No token provided");
//     return next(new Error("Authentication error"));
//   }

//   jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
//     if (err) {
//       console.error("Invalid token:", err.message);
//       return next(new Error("Authentication error"));
//     }
//     socket.user = decoded;
//     next();
//   });
// });

// Socket.IO Event Handling
io.on("connection", (socket) => {
  // console.log("User connected:", socket.id);

  socket.on("joinRoom", ({ roomId, user }) => {
    // console.log(roomId, user);
    socket.join(roomId);
  });

  socket.on("receiveMessage", async ({ roomId, MESSAGE }) => {
    // console.log(MESSAGE);
    // console.log(roomId);
    try {
      if (!roomId) {
        return console.error(`Invalid roomId: ${roomId}`);
      }

      saveMessage(MESSAGE)
        .then((data) => {
          io.to(roomId).emit("sendMessage", MESSAGE);
        })
        .catch((err) => {
          console.error(err);
        });
      //    const recipient = await User.findById(roomId);
      // if (!recipient) {
      //   return console.error(`Recipient with ID ${roomId} not found.`);
      // }

      // const newMessage = new Message({
      //   sender: socket.user.id,
      //   senderName: socket.user.name,
      //   recipient: recipient._id,
      //   recipientName: recipient.name,
      //   MESSAGE,
      // });

      // await newMessage.save();

      // console.log(
      //   `Message from ${user.name} to ${recipient.name}: ${message}`
      // );
    } catch (error) {
      console.error("Error sending message:", error);
    }
  });

  socket.on("disconnect", () => {
    if (socket.user) {
      console.log("User disconnected:", socket.user.id);
    } else {
      console.log("Unauthenticated user disconnected:", socket.id);
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
