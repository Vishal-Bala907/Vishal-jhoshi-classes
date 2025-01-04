const express = require("express");
const {
  getAllSessions,
  getSessionById,
  startSession,
  stopSession,
  updateSession,
  deleteSession,
  createSessionAlert,
  getAllTodaysSessions,
  goLiveWithSession,
  getAllSessionsOfThisMonth,
  updateSessionById,
} = require("../controllers/sessionController");

const router = express.Router();

// create a session alert
router.post("/session/create", createSessionAlert);

router.post("/session/get/today", getAllTodaysSessions);

router.get("/session/:sessionId", getSessionById);

router.get("/session/update/:status/:sessionId", updateSessionById);

router.get("/session/all/month/:date", getAllSessionsOfThisMonth);

router.get("/session/goLive/:sessionId/:role/:userId", goLiveWithSession);

// Get all sessions for a specific user
router.get("/session/user/:userId", getAllSessions);

// Start a new session
router.post("/session/start", startSession);

// Stop an existing session
router.post("/session/stop/:sessionId", stopSession);

// Update an existing session
router.post("/session/update/:sessionId", updateSession);

// Delete a session
router.delete("/session/delete/:sessionId", deleteSession);

module.exports = router;
