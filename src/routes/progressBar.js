const express = require('express');
const { getUserProgress, updateUserProgress } = require('../controllers/userController');

const router = express.Router();


router.get('/progress/:progressId', getUserProgress);

router.post('/progress/:progressId', updateUserProgress);

module.exports = router;
