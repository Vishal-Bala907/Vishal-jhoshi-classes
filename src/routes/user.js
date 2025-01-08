const express = require("express");
const {
  getMyProfile,
  updateProfile,
  getOtherUserProfile,
  getUserProgress,
  updateUserProgress,
  startStudySession,
  stopStudySession,
  updateImage,
  getStudySessions,
  getAllStudySessions,
} = require("../controllers/userController");

const router = express.Router();

router.post("/me", getMyProfile);

router.put("/me", updateProfile);

router.get("/users/:userId", getOtherUserProfile);

router.post("/update-image/", updateImage);

router.get("/progress/:progressId", getUserProgress);

router.post("/progress/:progressId", updateUserProgress);

router.post("/studyMode/startStudySession", startStudySession);

router.post("/studyMode/stopStudySession", stopStudySession);

router.post("/studyMode/stopStudySession", stopStudySession);

router.get("/studyMode/study-sessions", getStudySessions);
router.get("/studyMode/all/:userId", getAllStudySessions);

module.exports = router;
