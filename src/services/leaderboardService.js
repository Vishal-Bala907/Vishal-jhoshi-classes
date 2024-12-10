const StudySession = require('../models/StudySession');
const Leaderboard = require('../models/Leaderboard');

const generateDailyLeaderBoard = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
        const studyData = await StudySession.aggregate([
            { $match: { startTime: { $gte: today } } },
            { $group: { _id: { userId: '$userId', subject: '$subject' }, totalDuration: { $sum: '$duration' } } },
            { $sort: { totalDuration: -1 } }
        ]);

        const leaderBoardData = {};

        studyData.forEach(({ _id, totalDuration }) => {
            const { userId, subject } = _id;
            if (!leaderBoardData[subject]) leaderBoardData[subject] = [];

            leaderBoardData[subject].push({ userId, totalStudyTime: totalDuration });
        });

        for (const subject in leaderBoardData) {
            const newLeaderBoard = new Leaderboard({
                date: today,
                subject,
                topStudents: leaderBoardData[subject].slice(0, 10)
            });
            await newLeaderBoard.save();
        }

        console.log('LeaderBoard generated successfully.');
    } catch (error) {
        console.error('Error generating LeaderBoard:', error);
    }
};

module.exports = {
    generateDailyLeaderBoard
};
