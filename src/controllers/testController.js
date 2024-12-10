const mammoth = require('mammoth');
const Test = require('../models/Test');
const Progress = require('../models/Progress');
const User = require('../models/User');
const Leaderboard = require('../models/Test-Leaderboard');
const { validationResult } = require('express-validator');
const { parseQuestionsAndOptions, validateTest } = require('../services/testService');
const { success, notFound, internalServerError, created } = require('../helpers/responseType');

exports.createTest = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.json(badRequest([errors.array()]));
    }

    const { name, description, questions, test_type } = req.body;

    try {
        const newTest = new Test({
            name,
            description,
            questions,
            test_type
        });
        await newTest.save();

        res.json(created({ message: 'Test created successfully', test: newTest }));
    } catch (error) {
        console.error('Error creating test:', error);
        res.json(internalServerError([{ message: 'Error creating test' }]));
    }
};

exports.updateTest = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.json(badRequest([errors.array()]));
    }

    const { name, description, questions } = req.body;
    const { testId } = req.params;

    try {
        const updatedTest = await Test.findByIdAndUpdate(
            testId,
            req.body,
            { new: true }
        );

        if (!updatedTest) {
            return res.json(notFound([{ message: 'Test not found' }]));
        }

        res.json(success({ message: 'Test updated successfully', test: updatedTest }));
    } catch (error) {
        console.error('Error updating test:', error);
        res.json(internalServerError([{ message: 'Error updating test' }]));
    }
};

exports.deleteTest = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.json(badRequest([errors.array()]));
    }

    const { testId } = req.params;

    try {
        const deletedTest = await Test.findByIdAndDelete(testId);

        if (!deletedTest) {
            return res.json(notFound([{ message: 'Test not found' }]));
        }

        res.json(success({ message: 'Test deleted successfully' }));
    } catch (error) {
        console.error('Error deleting test:', error);
        res.json(internalServerError([{ message: 'Error deleting test' }]));
    }
};

exports.getAllTests = async (req, res) => {
    try {
        const { type } = req.query;

        let tests;
        if (type) {
            tests = await Test.find({ test_type: type }).select('-questions');
        } else {
            tests = await Test.find().select('-questions');
        }

        res.json(success({ tests: tests.reverse() }));
    } catch (error) {
        console.error('Error retrieving tests:', error);
        res.json(internalServerError([{ message: 'Error retrieving tests' }]));
    }
};

exports.getTestById = async (req, res) => {
    const { testId } = req.params;

    try {
        const test = await Test.findById(testId);

        if (!test) {
            return res.json(notFound([{ message: 'Test not found' }]));
        }

        res.json(success({ test }));
    } catch (error) {
        console.error('Error retrieving test:', error);
        res.json(internalServerError([{ message: 'Error retrieving test' }]));
    }
};

exports.uploadTest = async (req, res) => {
    try {
        const { name, description, test_type } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'File upload is required' });
        }

        const { value: fileText } = await mammoth.extractRawText({ path: req.file.path });
        const questions = parseQuestionsAndOptions(fileText);

        // const test = new Test({
        //     name,
        //     description,
        //     questions,
        //     test_type
        // });

        console.log(questions);
        // await test.save();
        res.status(201).json({ message: 'Test created successfully', test });
    } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).json({ message: 'Error processing file', error });
    }
}

exports.validateTestResult = async (req, res) => {
    try {
        const { progressId, testId, answers, userId, timeTaken, questionTime } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required to create progress.' });
        }

        const test = await Test.findById(testId);
        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }

        const validationResult = await validateTest(testId, answers, questionTime);

        const correctCount = validationResult.correctCount;
        const wrongCount = validationResult.wrongCount;
        const totalQuestions = validationResult.totalQuestions;
        const score = validationResult.totalScore; // Use totalScore from validationResult

        let progress;
        let isNewProgress = false;
        if (progressId) {
            progress = await Progress.findById(progressId);
            isNewProgress = false;
        }

        if (!progress) {
            progress = new Progress({
                student: userId,
                coursesCompleted: [],
                scores: [],
                testResults: [],
                overallScore: 0
            });
            isNewProgress = true;
        }

        const courseName = test.name;

        if (correctCount === totalQuestions) {
            if (!progress.coursesCompleted.includes(courseName)) {
                progress.coursesCompleted.push(courseName);
            }
        }

        const existingScoreIndex = progress.scores.findIndex(item => item.course === courseName);
        if (existingScoreIndex !== -1) {
            progress.scores[existingScoreIndex].score = score;
        } else {
            progress.scores.push({ course: courseName, score });
        }
        const newResult = progress.testResults.filter((result) => result.test._id != testId)
        newResult.push({
            test: testId,
            totalQuestions,
            correctCount,
            wrongCount,
            score,
            dateTaken: Date.now(),
            correctAnswers: validationResult.correctAnswers,
            wrongAnswers: validationResult.wrongAnswers,
            attemptedQuestionIndexes: validationResult.attemptedQuestionIndexes,
            attemptedQuestionCount: validationResult.attemptedQuestionCount,
            correctAnswerIndexes: validationResult.correctAnswerIndexes,
            userAnswers: validationResult.userAnswers,
            subjectScores: validationResult.subjectScores,
            timeTaken
        });

        progress.testResults = newResult

        const totalScore = progress.scores.reduce((sum, record) => sum + record.score, 0);
        progress.overallScore = totalScore / progress.scores.length;

        await progress.save();

        if (isNewProgress) {
            await User.findByIdAndUpdate(userId, { progressId: progress._id });
        }

        if (!test?.students?.includes(userId)) {
            test?.students?.push(userId);
        }
        test.count = test.students.length;

        await test.save();

        let leaderboard = await Leaderboard.findOne({ testId });

        if (!leaderboard) {
            leaderboard = new Leaderboard({ testId, entries: [] });
        }

        const existingEntryIndex = leaderboard.entries.findIndex(entry => entry.studentId.toString() === userId);

        if (existingEntryIndex !== -1) {
            leaderboard.entries[existingEntryIndex] = {
                studentId: userId,
                score,
                correctAnswers: correctCount,
                timeTaken,
                attemptedQuestions: validationResult.attemptedQuestionCount
            };
        } else {
            leaderboard.entries.push({
                studentId: userId,
                score,
                correctAnswers: correctCount,
                timeTaken,
                attemptedQuestions: validationResult.attemptedQuestionCount
            });
        }

        leaderboard.entries.sort((a, b) => b.score - a.score);

        leaderboard.entries.forEach((entry, index) => {
            entry.rank = index + 1;
        });

        await leaderboard.save();

        res.json(success({ validationResult: { ...validationResult, timeTaken }, progress }));
    } catch (error) {
        console.error('Error updating test progress:', error);
        res.status(500).json(internalServerError([{ message: 'Error updating test progress' }]));
    }
};

exports.getTestLeaderboard = async (req, res) => {
    try {
        const { testId } = req.params;

        const leaderboard = await Leaderboard.findOne({ testId })
            .populate('entries.studentId', 'name') // Assuming `User` schema has a `name` field
            .select('-__v -createdAt -updatedAt'); // Exclude unnecessary fields

        if (!leaderboard) {
            return res.status(404).json({ message: 'Leaderboard not found for this test.' });
        }

        res.json({ leaderboard });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ message: 'Error fetching leaderboard' });
    }
};
