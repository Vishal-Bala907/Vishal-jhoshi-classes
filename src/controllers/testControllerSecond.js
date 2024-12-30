const { json } = require("body-parser");
const AnswersSchema = require("../models/AnswersSchema");
const IntegerTypeQuestions = require("../models/IntegerTypeQuestions");
const LiveTest = require("../models/LiveTest");
const SelectTypeQuestions = require("../models/SelectTypeQuestions");
const TestSession = require("../models/attendedTests"); // Import the TestSession model
const MatchColumn = require("../models/matchColumnSchema");

exports.getTest = async (req, res) => {
  const { role } = req.params;
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayTimeStamp = midnight.getTime();
  if (role === "admin") {
    try {
      // Fetch all tests sorted by timestamp in descending order
      const allTests = await LiveTest.find().sort({ timestamp: -1 });
      res.status(200).json(allTests);
    } catch (error) {
      console.error("Error fetching tests:", error);
    }
  } else if (role === "student") {
    // Fetch all tests with timestamp >= today's midnight

    try {
      // Fetch all tests sorted by timestamp in descending order

      const todaysTests = await LiveTest.find({
        timestamp: { $gte: todayTimeStamp },
      }).sort({ timestamp: 1 });
      res.status(200).json(todaysTests);
    } catch (error) {
      console.error("Error fetching tests:", error);
    }
  }
};

exports.updateTestAttemp = async (req, res) => {
  const { testId } = req.params;
  try {
    const test = LiveTest.findById(testId);
    if (!test) {
      return res.json(404).message({ message: "test-not-found" });
    }
    test.canAttempt = true;
    await test.save();
  } catch (err) {
    return res.json(500).message({ message: `server error ${err.message}` });
  }
};

exports.getTestById = async (req, res) => {
  try {
    const { id } = req.params;

    const test = await LiveTest.findById(id);

    if (test) {
      return res.status(201).json({ data: test });
    } else {
      return res.status(404).json({ message: "test not found" });
    }
  } catch (error) {
    console.error("Error fetching test sessions:", error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

exports.getAttendedTest = async (req, res) => {
  try {
    const { id } = req.params; // `id` represents the student ID

    // Find all test sessions associated with the student ID
    const testSessions = await TestSession.find({ studentId: id });
    // If no sessions are found, return a 404 response
    if (testSessions.length === 0) {
      return res
        .status(404)
        .json({ message: "No test sessions found for this student." });
    }

    // Return the test sessions
    res.status(200).json({
      data: testSessions,
    });
  } catch (error) {
    console.error("Error fetching test sessions:", error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

exports.attendTest = async (req, res) => {
  try {
    const { testId, studentId } = req.params;

    // Check if a session already exists for this student and test
    const existingSession = await TestSession.findOne({
      liveTestId: testId,
      studentId,
    });

    if (existingSession) {
      return res
        .status(400)
        .json({ message: "Test session already exists for this student." });
    }

    // Get the current timestamp as the start time
    const startTime = new Date();

    // Set an end time based on the test duration (e.g., 2 hours from startTime)
    // You may fetch the duration dynamically from the LiveTest collection.
    const testDurationInHours = 2; // Example: 2 hours
    const endTime = new Date(
      startTime.getTime() + testDurationInHours * 60 * 60 * 1000
    );

    // Create and save the new test session
    const testSession = new TestSession({
      liveTestId: testId,
      studentId,
      startTime,
      endTime,
    });

    const savedSession = await testSession.save();

    res.status(201).json({
      message: "Test session created successfully.",
      data: savedSession,
    });
  } catch (error) {
    console.error("Error creating test session:", error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

exports.getQuestion = async (req, res) => {
  try {
    const { questionId, questionType } = req.params;
    let data = null;
    if (questionType === "integer") {
      data = await IntegerTypeQuestions.findById(questionId);
    } else if (questionType === "select") {
      data = await SelectTypeQuestions.findById(questionId);
    } else {
      data = await MatchColumn.findById(questionId);
    }
    if (data) {
      return res.status(200).json(data);
    } else {
      return res.status(404).json({ message: "Question not found." });
    }
  } catch (error) {
    console.error("Error creating test session:", error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

exports.getTestData = async (req, res) => {
  try {
    const { testId, userId } = req.params;
    console.log(testId);
    console.log(userId);

    // Check if a session already exists for this student and test
    const existingSession = await AnswersSchema.find({
      $and: [{ testId: testId }, { userId: userId }],
    });

    if (!existingSession) {
      return res
        .status(400)
        .json({ message: "Test session not exists for this student." });
    }

    res.status(201).json({
      data: existingSession,
    });
  } catch (error) {
    console.error("Error creating test session:", error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};
