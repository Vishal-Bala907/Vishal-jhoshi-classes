const Session = require("../models/Session"); // Import your Session model
const User = require("../models/User"); // Import your User model if needed
const AdminNotifications = require("../models/AdminNotifications");
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");

// exports.createSessionAlert = async (req, res) => {
//   const { sessionName, time, date } = req.body;

//   // console.log(date);const Session = require("../models/Session");
// const User = require("../models/User");
// const AdminNotifications = require("../models/AdminNotifications");

exports.createSessionAlert = async (req, res) => {
  try {
    const { sessionName, time, date } = req.body;
    const DATE = new Date(date);
    const SESSION = new Session({
      title: sessionName,
      time: time,
      date: DATE,
    });
    const session = await SESSION.save();
    if (session) {
      // Create an admin notification

      return res.status(201).json(session);
    }
  } catch (err) {
    return res.status(400).json({ message: `unable to save ${err}` });
  }
};

exports.getAllTodaysSessions = async (req, res) => {
  const day = new Date().getDate();
  const month = new Date().getMonth();
  const year = new Date().getFullYear();
  // console.log(date.toString().split("T")[0]);
  // Set start and end of today
  const startOfDay = new Date(year, month, day); // Start of today: 00:00:00
  const endOfDay = new Date(year, month, day + 1); // Start of tomorrow: 00:00:00
  try {
    const sessions = await Session.find({
      date: {
        $gte: startOfDay, // Matches from start of today
      },
    });

    res.status(200).json(sessions);
  } catch (err) {
    console.error("Error fetching session:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get session details by session ID
exports.goLiveWithSession = async (req, res) => {
  const { sessionId, role, userId } = req.params;

  const CHANNEL_NAME = "admin";
  const APP_ID = process.env.APP_ID;
  const APP_CERTIFICATE = process.env.APP_CERTIFICATE;
  const DEFAULT_EXPIRATION_TIME = process.env.TOKEN_EXPIRATION || 86400;
  const ROLE = role === "admin" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
  const USER_ID = userId;
  // Calculate expiration time
  const currentTime = Math.floor(Date.now() / 1000); // Current UNIX timestamp
  const privilegeExpireTime =
    currentTime + parseInt(DEFAULT_EXPIRATION_TIME, 10);

  // Ensure environment variables are loaded correctly
  if (!APP_ID || !APP_CERTIFICATE) {
    console.error("APP_ID and APP_CERTIFICATE must be set in the environment.");
    process.exit(1);
  }

  try {
    // Fetch the session by ID
    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Update the session status to ACTIVE
    session.status = "ACTIVE";
    await session.save();
    //generate token
    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      CHANNEL_NAME,
      USER_ID,
      ROLE,
      privilegeExpireTime
    );

    // Send a success response
    res.status(200).json({
      message: "Session is now live",
      session,
      data: {
        token,
        CHANNEL_NAME,
        ROLE,
        USER_ID,
        privilegeExpireTime,
      },
    });
  } catch (error) {
    // Handle errors
    console.error("Error activating session:", error);
    res.status(500).json({
      message: "An error occurred while updating the session",
      error: error.message,
    });
  }
};
// Get session details by session ID
exports.getSessionById = async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json(session);
  } catch (error) {
    console.error("Error fetching session:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllSessions = async (req, res) => {
  const { userId } = req.params;

  try {
    const sessions = await Session.find({ userId }); // Assuming your Session model has a userId field

    if (!sessions.length) {
      return res
        .status(404)
        .json({ message: "No sessions found for this user" });
    }

    res.json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.startSession = async (req, res) => {
  const { userId, title, description } = req.body;

  try {
    const newSession = new Session({
      userId,
      title,
      description,
      status: "active",
    });
    await newSession.save();

    res
      .status(201)
      .json({ message: "Session started successfully", session: newSession });
  } catch (error) {
    console.error("Error starting session:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Stop a session
exports.stopSession = async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await Session.findByIdAndUpdate(
      sessionId,
      { status: "inactive" }, // Marking session as inactive
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json({ message: "Session stopped successfully", session });
  } catch (error) {
    console.error("Error stopping session:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a session
exports.updateSession = async (req, res) => {
  const { sessionId } = req.params;
  const { title, description } = req.body;

  try {
    const updatedSession = await Session.findByIdAndUpdate(
      sessionId,
      { title, description },
      { new: true, runValidators: true }
    );

    if (!updatedSession) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json({
      message: "Session updated successfully",
      session: updatedSession,
    });
  } catch (error) {
    console.error("Error updating session:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a session
exports.deleteSession = async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await Session.findByIdAndDelete(sessionId);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Error deleting session:", error);
    res.status(500).json({ message: "Server error" });
  }
};
