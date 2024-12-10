const express = require('express');
const { getMyProfile, updateProfile, getOtherUserProfile, getUserProgress, updateUserProgress, startStudySession, stopStudySession } = require('../controllers/userController');

const router = express.Router();

router.post('/me', getMyProfile);

router.put('/me', updateProfile);

router.get('/users/:userId', getOtherUserProfile);

router.get('/progress/:progressId', getUserProgress);

router.post('/progress/:progressId', updateUserProgress);

router.post('/studyMode/startStudySession', startStudySession);

router.post('/studyMode/stopStudySession', stopStudySession);

module.exports = router;
