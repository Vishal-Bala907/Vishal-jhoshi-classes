const User = require("../models/User");
const StudySession = require("../models/StudySession");
const Progress = require("../models/Progress");
const Test = require("../models/Test");
const { internalServerError } = require("../helpers/responseType");
const path = require("path");
const formidable = require("formidable");
const fs = require("fs");

// Folder to store uploaded images
const IMAGE_FOLDER = path.join(__dirname, "../../uploads", "test", "images");
if (!fs.existsSync(IMAGE_FOLDER)) {
  fs.mkdirSync(IMAGE_FOLDER);
}

// Helper function to save a base64 image
function saveBase64Image(base64String, folder, fileName) {
  const matches = base64String.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    throw new Error("Invalid Base64 string");
  }

  const fileType = matches[1].split("/")[1]; // Extract file type (e.g., png, jpeg)
  const imageData = matches[2];
  const filePath = path.join(folder, `${fileName}.${fileType}`); // Absolute path

  fs.writeFileSync(filePath, Buffer.from(imageData, "base64"));

  // Return the relative path for the webapp (starting from the /images route)
  return `/images/${fileName}.${fileType}`; // Directly return the file name with /images prefix
}

exports.updateImage = async (req, res) => {
  try {
    const { image, userId } = req.body;

    console.log(image);

    // Validate input
    if (!userId || !image) {
      return res
        .status(400)
        .json({ success: false, message: "userId and image are required" });
    }

    // Validate Base64 image format
    const isBase64 = (str) =>
      /^data:image\/(png|jpeg|jpg|gif);base64,/.test(str);
    if (!isBase64(image)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid image format" });
    }

    let descriptionImagePath = "";

    // Save the image
    try {
      const uniqueFileName = `description_${Date.now()}`;
      descriptionImagePath = saveBase64Image(
        image,
        IMAGE_FOLDER,
        uniqueFileName
      );
      console.log(`Image saved at: ${descriptionImagePath}`);
    } catch (error) {
      console.error("Error saving image:", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Failed to save image" });
    }

    // Find user and update
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.image_url = descriptionImagePath;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: { user },
    });
  } catch (error) {
    console.error("Error updating user image:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getMyProfile = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.json(internalServerError());
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, location, birthDate } = req.body;
    const user = await User.findByIdAndUpdate(req.body._id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    res.json(internalServerError());
  }
};

exports.getOtherUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("name bio location");
    if (!user) return res.status(404).json({ message: "User not found" });
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
      path: "testResults.test", // Populate test details in test results
      select: "name test_type", // Select only necessary fields
    });

    console.log(progress);

    if (!progress) {
      return res.status(404).json({ message: "User progress not found" });
    }

    // Fetch all tests
    const allTests = await Test.find().select("test_type");

    // Categorize tests into "Live" and "Practice"
    const totalTestsByType = allTests.reduce((acc, test) => {
      acc[test.test_type] = (acc[test.test_type] || 0) + 1;
      return acc;
    }, {});

    // Count completed tests by type
    const completedTestsByType = progress.testResults.reduce((acc, result) => {
      const type = result?.test?.test_type ?? "";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

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
    console.error("Error fetching user progress:", error);
    res.status(500).json({ message: "Error fetching user progress" });
  }
};

exports.updateUserProgress = async (req, res) => {
  try {
    const { progressId } = req.params;
    const progress = await Progress.findByIdAndUpdate(progressId, req.body, {
      new: true,
      runValidators: true,
    });
    if (!progress) return res.status(404).json({ message: "User not found" });
    res.json(progress);
  } catch (error) {
    res.json(internalServerError());
  }
};

exports.startStudySession = async (req, res) => {
  const { userId, subject } = req.body;
  try {
    const newSession = new StudySession({
      userId,
      subject,
      startTime: new Date(),
    });
    await newSession.save();
    await User.findByIdAndUpdate(userId, {
      $push: { studySessions: newSession._id },
    });

    res
      .status(200)
      .json({ message: "Study session started", session: newSession });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error starting study session", error });
  }
};

exports.stopStudySession = async (req, res) => {
  const { userId, subject, startTime, endTime, date, duration } = req.body;

  try {
    // Validate data
    if (!userId || !subject || !startTime || !endTime || !date || !duration) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Create a new session document
    const session = new StudySession({
      userId,
      subject,
      startTime,
      endTime,
      date,
      duration,
    });

    // Save to database
    await session.save();

    return res
      .status(201)
      .json({ message: "Session saved successfully", session });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};
exports.getStudySessions = async (req, res) => {
  try {
    const { userId } = req.query; // Get userId from query params

    if (!userId) {
      return res.status(400).json({ error: "UserId is required" });
    }

    // Fetch all study sessions for the given userId
    const sessions = await StudySession.find({ userId });

    // Aggregate total time spent on each subject
    const subjectTimeMap = {};

    sessions.forEach((session) => {
      const { subject, duration } = session;

      if (subjectTimeMap[subject]) {
        subjectTimeMap[subject] += duration;
      } else {
        subjectTimeMap[subject] = duration;
      }
    });

    // Return the aggregated data in the desired format
    const result = Object.keys(subjectTimeMap).map((subject) => ({
      subject,
      totalTime: subjectTimeMap[subject], // Total time in minutes
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching study sessions:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching study sessions" });
  }
};

// Get all study sessions for a specific user
exports.getAllStudySessions = async (req, res) => {
  const { userId } = req.params;
  // console.log("userid " + userId);
  try {
    const sessions = await StudySession.find({ userId });

    if (!sessions) {
      return res
        .status(404)
        .json({ message: "No study sessions found for this user." });
    }

    // Return the study sessions as a response
    res.status(200).json(sessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching study sessions." });
  }
};
