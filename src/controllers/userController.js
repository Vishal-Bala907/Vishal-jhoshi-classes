const User = require('../models/User');
const StudySession = require('../models/StudySession');
const Progress = require('../models/Progress');
const Test = require('../models/Test');
const { internalServerError } = require('../helpers/responseType');

exports.getMyProfile = async (req, res) => {
    const { email } = req.body
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.json(internalServerError());
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, bio, location, birthDate } = req.body;
        const user = await User.findByIdAndUpdate(
            req.body._id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
        res.json(internalServerError());
    }
};

exports.getOtherUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).select('name bio location');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.json(internalServerError());
    }
};


exports.getUserProgress = async (req, res) => {
    try {
        const { progressId } = req.params;

        // Fetch the user's progress document
        const progress = await Progress.findById(progressId).populate({
            path: 'testResults.test', // Populate test details in test results
            select: 'name test_type', // Select only necessary fields
        });

        console.log(progress)

        if (!progress) {
            return res.status(404).json({ message: 'User progress not found' });
        }

        // Fetch all tests
        const allTests = await Test.find().select('test_type');

        // Categorize tests into "Live" and "Practice"
        const totalTestsByType = allTests.reduce(
            (acc, test) => {
                acc[test.test_type] = (acc[test.test_type] || 0) + 1;
                return acc;
            },
            {}
        );

        // Count completed tests by type
        const completedTestsByType = progress.testResults.reduce(
            (acc, result) => {
                const type = result?.test?.test_type ?? '';
                acc[type] = (acc[type] || 0) + 1;
                return acc;
            },
            {}
        );

        // Calculate remaining tests by type
        const remainingTestsByType = Object.keys(totalTestsByType).reduce(
            (acc, type) => {
                acc[type] = totalTestsByType[type] - (completedTestsByType[type] || 0);
                return acc;
            },
            {}
        );

        // Calculate additional insights
        const totalTestsGiven = progress.testResults.length;
        const overallScore = progress.overallScore;
        const coursesCompletedCount = progress.coursesCompleted.length;

        // Prepare the response
        const insights = {
            totalTestsGiven,
            overallScore,
            coursesCompletedCount,
            testsByType: {
                total: totalTestsByType,
                completed: completedTestsByType,
                remaining: remainingTestsByType,
            },
        };

        res.json({ progress, insights });
    } catch (error) {
        console.error('Error fetching user progress:', error);
        res.status(500).json({ message: 'Error fetching user progress' });
    }
};

exports.updateUserProgress = async (req, res) => {
    try {
        const { progressId } = req.params;
        const progress = await Progress.findByIdAndUpdate(progressId,
            req.body,
            { new: true, runValidators: true });
        if (!progress) return res.status(404).json({ message: 'User not found' });
        res.json(progress);
    } catch (error) {
        res.json(internalServerError());
    }
};

exports.startStudySession = async (req, res) => {
    const { userId, subject } = req.body;
    try {
        const newSession = new StudySession({ userId, subject, startTime: new Date() });
        await newSession.save();
        await User.findByIdAndUpdate(userId, { $push: { studySessions: newSession._id } });

        res.status(200).json({ message: 'Study session started', session: newSession });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error starting study session', error });
    }
};

exports.stopStudySession = async (req, res) => {
    const { sessionId } = req.body;

    try {
        const session = await StudySession.findById(sessionId);
        if (!session) return res.status(404).json({ message: 'Study session not found' });

        session.endTime = new Date();
        session.duration = Math.round((session.endTime - session.startTime) / 60000);
        await session.save();

        res.status(200).json({ message: 'Study session ended', session });
    } catch (error) {
        res.status(500).json({ message: 'Error ending study session', error });
    }
};