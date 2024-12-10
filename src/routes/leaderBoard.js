const express = require('express');
const { generateDailyLeaderBoard } = require('../services/leaderboardService');

const router = express.Router();

router.get('/leader_board', generateDailyLeaderBoard);

module.exports = router;