const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
require("dotenv").config();

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
const AdminNotifications = require("./models/AdminNotifications");
const app = express();

const allowedOrigins = [
  "https://vishal-joshi-sir-classes-fontend.vercel.app", // Production
  "http://localhost:3000", // Development
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS Error: Origin ${origin} is not allowed.`));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// Apply CORS middleware
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Handle preflight requests
// Body Parser configuration
app.use(bodyParser.json({ limit: "20mb" }));
app.use(bodyParser.urlencoded({ limit: "20mb", extended: true }));

// Serve uploaded images
const IMAGE_FOLDER = path.join(__dirname, "../uploads", "test", "images");
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
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket.IO Middleware for Authentication
// io.use((socket, next) => {
//   const token = socket.handshake.auth.token;
//   if (!token) {
//     return next(new Error("Authentication error: No token provided"));
//   }

//   jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
//     if (err) {
//       return next(new Error("Authentication error: Invalid token"));
//     }
//     socket.user = decoded;
//     next();
//   });
// });

// Socket.IO Event Handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinRoom", ({ roomId, user }) => {
    console.log(`User ${user} joined room ${roomId}`);
    socket.join(roomId);
  });

  socket.on("receiveMessage", async ({ roomId, MESSAGE }) => {
    try {
      if (!roomId) {
        return console.error("Invalid roomId:", roomId);
      }

      saveMessage(MESSAGE)
        .then((data) => {
          io.to(roomId).emit("sendMessage", MESSAGE);
        })
        .catch((err) => {
          console.error("Error saving message:", err);
        });
    } catch (error) {
      console.error("Error receiving message:", error);
    }
  });

  socket.on("adminNotification", async ({ sessionObj }) => {
    if (sessionObj) {
      const { sessionName, time, date } = sessionObj;
      const DATE = new Date(date);

      const notification = new AdminNotifications({
        sender: "admin",
        time: time,
        date: DATE,
        message: `New Live ${sessionName} Class Will Be Taken at ${date} - ${time}`,
      });

      try {
        const noti = await notification.save();
        io.emit("adminNoti", noti);
      } catch (error) {
        console.error("Error saving notification:", error);
        socket.emit("error", { message: "Unable to save notification." });
      }
    }
  });

  socket.on("startingLive", ({ message }) => {
    io.emit("liveStarting", { message });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;

// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const bodyParser = require("body-parser");
// const jwt = require("jsonwebtoken");
// require("dotenv").config();
// const multer = require("multer");
// const path = require("path");

// // Route Imports
// const authRoutes = require("./routes/auth");
// const userRoutes = require("./routes/user");
// const chatRoutes = require("./routes/chatRoutes");
// const testRoutes = require("./routes/testRoutes");
// const rolesRoutes = require("./routes/roles");
// const sessionRoutes = require("./routes/classSession");

// // Socket.IO imports
// const http = require("http");
// const { Server } = require("socket.io");
// const Message = require("./models/Message");

// const { saveMessage } = require("./helpers/functions/SaveMessages");
// const AdminNotifications = require("./models/AdminNotifications");

// // CORS options to specify allowed origins
// // const corsOptions = {
// //   origin: "https://vishal-joshi-sir-classes-fontend.vercel.app", // Frontend URL
// //   methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed methods
// //   allowedHeaders: ["Content-Type", "Authorization"], // Specify allowed headers
// // };
// const corsOptions = {
//   origin: "*", // Frontend URL
//   methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed methods
//   allowedHeaders: ["Content-Type", "Authorization"], // Specify allowed headers
// };

// // Initialize Express app
// const app = express();

// // Apply CORS middleware globally
// app.use(cors(corsOptions));

// app.options("*", cors(corsOptions));  // Allow OPTIONS preflight request

// app.use(bodyParser.json({ limit: "20mb" })); // Set limit to 10MB
// app.use(bodyParser.urlencoded({ limit: "20mb", extended: true })); // For form data
// // Define the path to the images folder outside the `src` directory
// // Folder to store uploaded images
// const IMAGE_FOLDER = path.join(__dirname, "../uploads", "test", "images");
// // Serve the images folder
// app.use("/images", express.static(IMAGE_FOLDER));
// // MongoDB Connection
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => console.log("MongoDB connected"))
//   .catch((err) => console.error("MongoDB connection error:", err));

// // Routes
// app.get("/", (req, res) => res.send("Welcome to the admin"));

// app.use("/api/auth", authRoutes);
// app.use(
//   "/api/v1",
//   userRoutes,
//   chatRoutes,
//   testRoutes,
//   rolesRoutes,
//   sessionRoutes
// );

// // Create HTTP server and initialize Socket.IO
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "*", // Adjust to your frontend URL
//     methods: ["GET", "POST"],
//   },
// });

// // Socket.IO Middleware for Authentication
// // io.use((socket, next) => {
// //   const token = socket.handshake.auth.token;
// //   if (!token) {
// //     console.error("No token provided");
// //     return next(new Error("Authentication error"));
// //   }

// //   jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
// //     if (err) {
// //       console.error("Invalid token:", err.message);
// //       return next(new Error("Authentication error"));
// //     }
// //     socket.user = decoded;
// //     next();
// //   });
// // });

// // Socket.IO Event Handling
// io.on("connection", (socket) => {
//   // console.log("User connected:", socket.id);

//   socket.on("joinRoom", ({ roomId, user }) => {
//     // console.log(roomId, user);
//     socket.join(roomId);
//   });

//   socket.on("receiveMessage", async ({ roomId, MESSAGE }) => {
//     // console.log(MESSAGE);
//     // console.log(roomId);
//     try {
//       if (!roomId) {
//         return console.error(`Invalid roomId: ${roomId}`);
//       }

//       saveMessage(MESSAGE)
//         .then((data) => {
//           io.to(roomId).emit("sendMessage", MESSAGE);
//         })
//         .catch((err) => {
//           console.error(err);
//         });
//     } catch (error) {
//       console.error("Error sending message:", error);
//     }
//   });

//   socket.on("adminNotification", async ({ sessionObj }) => {
//     if (sessionObj) {
//       const { sessionName, time, date } = sessionObj;
//       const DATE = new Date(date);

//       // Create the notification object
//       const notification = new AdminNotifications({
//         sender: "admin",
//         time: time,
//         date: DATE,
//         message: `New Live ${sessionName} Class Will Be Taken at ${date} - ${time}`,
//       });

//       try {
//         // Save the notification to the database
//         const noti = await notification.save();

//         // Broadcast the notification to all connected clients
//         io.emit("adminNoti", noti); // Broadcast to all connected clients
//       } catch (error) {
//         console.error("Error saving notification:", error);
//         socket.emit("error", { message: "Unable to save notification." });
//       }
//     }
//   });

//   socket.on("startingLive", async ({ message }) => {
//     io.emit("liveStarting", { message: message });
//   });
//   socket.on("disconnect", () => {
//     if (socket.user) {
//       console.log("User disconnected:", socket.user.id);
//     } else {
//       console.log("Unauthenticated user disconnected:", socket.id);
//     }
//   });
// });

// // Start the server
// const PORT = process.env.PORT || 3001;
// server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// module.exports = app;
