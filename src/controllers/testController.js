const mammoth = require("mammoth");
const Progress = require("../models/Progress");
const User = require("../models/User");
const Leaderboard = require("../models/TestLeaderboard");
const { validationResult } = require("express-validator");
const {
  parseQuestionsAndOptions,
  validateTest,
} = require("../services/testService");
const {
  success,
  notFound,
  internalServerError,
  created,
} = require("../helpers/responseType");
const TestQuestion = require("../models/IntegerTypeQuestions");
const LiveTest = require("../models/LiveTest");
const { saveQuestion } = require("../helpers/functions/SaveQuestions");
const formidable = require("formidable");
const fs = require("fs");
const path = require("path");
const Test = require("../models/Test");
const IntegerTypeQuestions = require("../models/IntegerTypeQuestions");
const SelectTypeQuestions = require("../models/SelectTypeQuestions");
const MatchColumn = require("../models/matchColumnSchema");
const AnswersSchema = require("../models/AnswersSchema");
const TestLeaderboard = require("../models/TestLeaderboard");

// const { created } = require("../helpers/responseHelper"); // Assuming you have a response helper

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

exports.saveSelectQuestions = async (req, res) => {
  const {
    subject,
    topic,
    subtopic,
    level,
    type,
    description,
    descriptionImage,
    optionType,
    textOptionsA,
    textOptionsB,
    textOptionsC,
    textOptionsD,
    imageOptionsA,
    imageOptionsB,
    imageOptionsC,
    imageOptionsD,
    correctAnswer,
  } = req.body;
  const { id } = req.params; // Test ID

  try {
    // Handle image saving (if Base64 is provided)
    let savedDescriptionImage = null;
    let savedImageOptions = { A: null, B: null, C: null, D: null };

    if (descriptionImage) {
      savedDescriptionImage = saveBase64Image(
        descriptionImage,
        IMAGE_FOLDER,
        `description-${Date.now()}`
      );
    }

    ["A", "B", "C", "D"].forEach((option) => {
      const optionImage = eval(`imageOptions${option}`);
      if (optionImage) {
        savedImageOptions[option] = saveBase64Image(
          optionImage,
          IMAGE_FOLDER,
          `option-${option}-${Date.now()}`
        );
      }
    });

    // Log or save the data to a database
    // console.log({
    //   subject,
    //   topic,
    //   subtopic,
    //   level,
    //   type,
    //   description,
    //   descriptionImage: savedDescriptionImage,
    //   optionType,
    //   textOptions: {
    //     A: textOptionsA,
    //     B: textOptionsB,
    //     C: textOptionsC,
    //     D: textOptionsD,
    //   },
    //   imageOptions: savedImageOptions,
    //   correctAnswer,
    // });

    // Return success response
    res.status(200).json({
      message: "Question uploaded successfully",
      savedDescriptionImage,
      savedImageOptions,
    });
  } catch (error) {
    console.error("Error handling upload:", error.message);
    res.status(500).json({ error: "Failed to upload question" });
  }
};

exports.createTestMeta = async (req, res) => {
  // console.log(req.body);
  try {
    const {
      Questions,
      category,
      date,
      description,
      instructions,
      negativeMarking,
      positiveMarking,
      testName,
      time,
      timeDuration,
    } = req.body;
    console.log(date);
    // Parse the date string into a Date object
    const [year, month, day] = date.split("-").map(Number); // Split into parts

    const parsedDate = new Date(year, month - 1, day); // Create Date object (month is 0-indexed)

    // Get the timestamp
    const timestamp = parsedDate.getTime();

    const test = new LiveTest({
      Questions,
      category,
      date,
      description,
      instructions,
      negativeMarking,
      positiveMarking,
      testName,
      time,
      timeDuration,
      timestamp: timestamp,
    });
    const data = await test.save();
    return res.status(201).json({ message: data });
  } catch (error) {
    return res.status(500).json(internalServerError("Error creating test"));
  }
};

exports.rescheduleTest = async (req, res) => {
  try {
    const { testId, testDate, testTime } = req.body;

    // Parse the date string into a Date object
    const [year, month, day] = testDate.split("-").map(Number);
    const parsedDate = new Date(year, month - 1, day);
    const timestamp = parsedDate.getTime();

    // Fetch the original test by ID
    const originalTest = await LiveTest.findById(testId);
    if (!originalTest) {
      return res.status(404).json({ message: "Test not found" });
    }

    // Create a new test object by cloning the original and updating fields
    const newTest = new LiveTest({
      ...originalTest.toObject(), // Clone all fields from the original test
      _id: undefined, // Remove the `_id` field to allow MongoDB to generate a new one
      testDate, // Update the date
      testTime, // Update the time
      timestamp, // Update the timestamp
    });

    // Save the new test object to the database
    const savedTest = await newTest.save();

    return res.status(201).json({
      message: "Test duplicated and rescheduled successfully",
      data: savedTest,
    });
  } catch (error) {
    console.error("Error duplicating and rescheduling test:", error);
    return res
      .status(500)
      .json({ message: "Error duplicating and rescheduling test" });
  }
};

exports.createMatchQuestion = async (req, res) => {
  const { id } = req.params; // Test ID

  let rightImgA, rightImgB, rightImgC, rightImgD;
  let leftImgA, leftImgB, leftImgC, leftImgD;
  let descriptionImagePath = "";

  // console.log(req.body);

  const {
    subject,
    topic,
    subtopic,
    level,
    type,
    leftOptionsA,
    leftOptionsB,
    leftOptionsC,
    leftOptionsD,
    rightOptionsA,
    rightOptionsB,
    rightOptionsC,
    rightOptionsD,
    leftImagesA,
    leftImagesB,
    leftImagesC,
    leftImagesD,
    rightImagesA,
    rightImagesB,
    rightImagesC,
    rightImagesD,
    correctMatchings,
    optionType,
    description,
    descriptionImage,
  } = req.body;

  // Fetch the test by ID
  const test = await LiveTest.findById(id);
  if (!test) {
    return res.status(404).json({ message: "Test not found" });
  }

  // Handle description image if it exists
  try {
    if (descriptionImage) {
      const uniqueFileName = `description_${Date.now()}`; // Generate a unique filename
      const savedDescriptionImagePath = saveBase64Image(
        descriptionImage,
        IMAGE_FOLDER,
        uniqueFileName
      );
      console.log(`Description image saved at: ${savedDescriptionImagePath}`);
      descriptionImagePath = savedDescriptionImagePath;
    }
  } catch (error) {
    console.error("Error saving description image:", error.message);
  }

  // ! Handling left iamges
  // Handle option A image if it exists
  try {
    if (leftImagesA) {
      const uniqueFileName = `optionA_${Date.now()}`; // Generate a unique filename
      leftImgA = saveBase64Image(leftImagesA, IMAGE_FOLDER, uniqueFileName);
      // console.log(`Option A image saved at: ${imageA}`);
    }
  } catch (error) {
    console.error("Error saving image for Option A:", error.message);
  }

  // Handle option B image if it exists
  try {
    if (leftImagesB) {
      const uniqueFileName = `optionB_${Date.now()}`; // Generate a unique filename
      leftImgB = saveBase64Image(leftImagesB, IMAGE_FOLDER, uniqueFileName);
      // console.log(`Option B image saved at: ${imageB}`);
    }
  } catch (error) {
    console.error("Error saving image for Option B:", error.message);
  }

  // // Handle option C image if it exists
  try {
    if (leftImagesC) {
      const uniqueFileName = `optionC_${Date.now()}`; // Generate a unique filename
      leftImgC = saveBase64Image(leftImagesC, IMAGE_FOLDER, uniqueFileName);
      // console.log(`Option C image saved at: ${imageC}`);
    }
  } catch (error) {
    console.error("Error saving image for Option C:", error.message);
  }

  // Handle option D image if it exists
  try {
    if (leftImagesD) {
      const uniqueFileName = `optionD_${Date.now()}`; // Generate a unique filename
      leftImgD = saveBase64Image(leftImagesD, IMAGE_FOLDER, uniqueFileName);
      // console.log(`Option D image saved at: ${imageD}`);
    }
  } catch (error) {
    console.error("Error saving image for Option D:", error.message);
  }

  // ! Handling right iamges
  // Handle option A image if it exists
  try {
    if (rightImagesA) {
      const uniqueFileName = `optionA_${Date.now()}`; // Generate a unique filename
      rightImgA = saveBase64Image(rightImagesA, IMAGE_FOLDER, uniqueFileName);
      // console.log(`Option A image saved at: ${imageA}`);
    }
  } catch (error) {
    console.error("Error saving image for Option A:", error.message);
  }

  // Handle option B image if it exists
  try {
    if (rightImagesB) {
      const uniqueFileName = `optionB_${Date.now()}`; // Generate a unique filename
      rightImgB = saveBase64Image(rightImagesB, IMAGE_FOLDER, uniqueFileName);
      // console.log(`Option B image saved at: ${imageB}`);
    }
  } catch (error) {
    console.error("Error saving image for Option B:", error.message);
  }

  // // Handle option C image if it exists
  try {
    if (rightImagesC) {
      const uniqueFileName = `optionC_${Date.now()}`; // Generate a unique filename
      rightImgC = saveBase64Image(rightImagesC, IMAGE_FOLDER, uniqueFileName);
      // console.log(`Option C image saved at: ${imageC}`);
    }
  } catch (error) {
    console.error("Error saving image for Option C:", error.message);
  }

  // Handle option D image if it exists
  try {
    if (rightImagesD) {
      const uniqueFileName = `optionD_${Date.now()}`; // Generate a unique filename
      rightImgD = saveBase64Image(rightImagesD, IMAGE_FOLDER, uniqueFileName);
      // console.log(`Option D image saved at: ${imageD}`);
    }
  } catch (error) {
    console.error("Error saving image for Option D:", error.message);
  }

  // Create a new SelectTypeQuestions document
  const newQuestion = new MatchColumn({
    subject,
    topic,
    subtopic,
    level,
    type,
    leftOptionsA,
    leftOptionsB,
    leftOptionsC,
    leftOptionsD,
    rightOptionsA,
    rightOptionsB,
    rightOptionsC,
    rightOptionsD,
    leftImagesA: leftImgA,
    leftImagesB: leftImgB,
    leftImagesC: leftImgC,
    leftImagesD: leftImgD,
    rightImagesA: rightImgA,
    rightImagesB: rightImgB,
    rightImagesC: rightImgC,
    rightImagesD: rightImgD,
    correctMatchings,
    optionType,
    description,
    descriptionImage: descriptionImagePath,
  });

  try {
    const question = await newQuestion.save();

    // Add the question's reference to the LiveTest document
    test.Questions.push({
      questionId: question._id,
      questionType: type,
      subject: subject,
    });

    // Save the updated LiveTest document
    const updatedTest = await test.save();

    return res.status(200).json({
      message: "Question created and added to the test successfully",
      question: question,
      test: updatedTest,
    });
  } catch (error) {
    console.error("Error creating and linking the question:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// const { saveBase64Image } = require("./path/to/your/imageSavingUtility"); // Adjust path as needed
// const IMAGE_FOLDER = "/path/to/your/image/folder"; // Ensure this is defined correctly

exports.createSelectQuestion = async (req, res) => {
  const { id } = req.params; // Test ID

  let imageA, imageB, imageC, imageD;
  let descriptionImagePath = "";

  // Destructuring request body with default values
  let {
    correctAnswer,
    description,
    descriptionImage,
    imageOptionsA,
    imageOptionsB,
    imageOptionsC,
    imageOptionsD,
    level,
    optionType,
    subject,
    subtopic,
    textOptionsA,
    textOptionsB,
    textOptionsC,
    textOptionsD,
    topic,
    type,
  } = req.body;

  // Fetch the test by ID
  const test = await LiveTest.findById(id);
  if (!test) {
    return res.status(404).json({ message: "Test not found" });
  }

  // Handle description image if it exists
  try {
    if (descriptionImage) {
      const uniqueFileName = `description_${Date.now()}`; // Generate a unique filename
      const savedDescriptionImagePath = saveBase64Image(
        descriptionImage,
        IMAGE_FOLDER,
        uniqueFileName
      );
      descriptionImagePath = savedDescriptionImagePath;
    }
  } catch (error) {
    console.error("Error saving description image:", error.message);
  }

  // Handle option A image if it exists
  try {
    if (imageOptionsA) {
      const uniqueFileName = `optionA_${Date.now()}`; // Generate a unique filename
      imageA = saveBase64Image(imageOptionsA, IMAGE_FOLDER, uniqueFileName);
    }
  } catch (error) {
    console.error("Error saving image for Option A:", error.message);
  }

  // Handle option B image if it exists
  try {
    if (imageOptionsB) {
      const uniqueFileName = `optionB_${Date.now()}`; // Generate a unique filename
      imageB = saveBase64Image(imageOptionsB, IMAGE_FOLDER, uniqueFileName);
    }
  } catch (error) {
    console.error("Error saving image for Option B:", error.message);
  }

  // Handle option C image if it exists
  try {
    if (imageOptionsC) {
      const uniqueFileName = `optionC_${Date.now()}`; // Generate a unique filename
      imageC = saveBase64Image(imageOptionsC, IMAGE_FOLDER, uniqueFileName);
    }
  } catch (error) {
    console.error("Error saving image for Option C:", error.message);
  }

  // Handle option D image if it exists
  try {
    if (imageOptionsD) {
      const uniqueFileName = `optionD_${Date.now()}`; // Generate a unique filename
      imageD = saveBase64Image(imageOptionsD, IMAGE_FOLDER, uniqueFileName);
    }
  } catch (error) {
    console.error("Error saving image for Option D:", error.message);
  }

  // Create a new SelectTypeQuestions document
  const newQuestion = new SelectTypeQuestions({
    correctAnswer,
    description,
    descriptionImage: descriptionImagePath,
    imageOptionsA: imageA,
    imageOptionsB: imageB,
    imageOptionsC: imageC,
    imageOptionsD: imageD,
    textOptionsA,
    textOptionsB,
    textOptionsC,
    textOptionsD,
    level,
    optionType,
    subject,
    subtopic,
    topic,
    type,
  });

  try {
    const question = await newQuestion.save();

    // Add the question's reference to the LiveTest document
    test.Questions.push({
      questionId: question._id,
      questionType: "select",
      subject: subject,
    });

    // Save the updated LiveTest document
    const updatedTest = await test.save();

    return res.status(200).json({
      message: "Question created and added to the test successfully",
      question: question,
      test: updatedTest,
    });
  } catch (error) {
    console.error("Error creating and linking the question:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.createintTest = async (req, res) => {
  try {
    const { id } = req.params; // Test ID
    const {
      subject,
      topic,
      subtopic,
      level,
      type,
      description,
      correctAnswer,
    } = req.body; // Extract question details from request body

    // Fetch the test by ID
    const test = await LiveTest.findById(id);
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    // Create a new TestQuestion object
    const newQuestion = new IntegerTypeQuestions({
      subject,
      topic,
      subtopic,
      level,
      type,
      description,
      correctAnswer,
    });

    // Save the question to the database
    const savedQuestion = await newQuestion.save();

    // Add the question's reference to the LiveTest document
    test.Questions.push({
      questionId: savedQuestion._id,
      questionType: "integer",
      subject: subject,
    });
    // Save the updated LiveTest document
    const updatedTest = await test.save();

    return res.status(200).json({
      message: "Question created and added to the test successfully",
      question: savedQuestion,
      test: updatedTest,
    });
  } catch (error) {
    console.error("Error creating and linking the question:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.createLiveTest = async (req, res) => {
  const {
    Questions,
    category,
    date,
    description,
    instructions,
    negativeMarking,
    positiveMarking,
    testName,
    time,
    timeDuration,
  } = req.body;
  console.log(req.body);

  const form = new formidable.IncomingForm();
  form.uploadDir = path.join(__dirname, "../../uploads/test/images"); // Define the upload directory
  form.keepExtensions = true; // Retain file extensions

  console.log("helloi");

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Error parsing the form:", err);
      return res.status(400).json({ message: "Error processing the request" });
    }

    console.log("helloiiiii");
    try {
      // Process all questions and save them in the database
      // Save questions and filter valid ones
      if (!Questions || !Array.isArray(Questions)) {
        console.log(Questions);
        return res
          .status(400)
          .json({ message: "Invalid or missing Questions array" });
      }
      const QUESTIONS = await Promise.all(
        Questions.map(async (questionData) => {
          try {
            let DESCRIPTIONIMAGE = null;

            // If there is a description image uploaded
            if (questionData.descriptionImage !== null) {
              console.log("Adding image...");
              const uploadedFile = questionData.descriptionImage[0];
              const uniqueSuffix = `${Date.now()}-${Math.round(
                Math.random() * 1e9
              )}`;
              const extension = path.extname(uploadedFile.originalFilename);
              const newFileName = `descriptionImage-${uniqueSuffix}${extension}`;

              const newFilePath = path.join(form.uploadDir, newFileName);

              // Move the file
              await new Promise((resolve, reject) => {
                fs.rename(uploadedFile.filepath, newFilePath, (renameErr) => {
                  if (renameErr) {
                    reject(renameErr);
                  } else {
                    DESCRIPTIONIMAGE = newFilePath; // Set the new file path for the image
                    resolve();
                  }
                });
              });
            }

            // Now process the question based on its type
            if (questionData.type === "integer") {
              const {
                correctAnswer,
                description,
                level,
                subject,
                subtopic,
                topic,
                type,
              } = questionData;

              const question = new TestQuestion({
                description,
                correctAnswer,
                level,
                topic,
                subtopic,
                subject,
                type,
              });

              const savedQuestion = await question.save();
              return {
                questionId: savedQuestion._id,
                questionType: type,
              };
            } else if (
              questionData.type === "single select" &&
              questionData.optionType === "text"
            ) {
              // Handle single select MCQ (text options)
              const {
                correctAnswer,
                description,
                optionType,
                textOptions,
                imageOptions,
                level,
                subject,
                subtopic,
                topic,
                type,
              } = questionData;

              const selectTypeQuestion = new SelectTypeQuestions({
                description,
                descriptionImage: DESCRIPTIONIMAGE,
                optionType,
                textOptions,
                imageOptions,
                correctAnswer,
                level,
                subject,
                subtopic,
                topic,
                type,
              });

              const savedQuestion = await selectTypeQuestion.save();
              return {
                questionId: savedQuestion._id,
                questionType: type,
              };
            } else {
              return null; // Invalid question type
            }
          } catch (error) {
            console.error("Error saving question:", error);
            return null;
          }
        })
      );

      // Filter out null or undefined values
      const filteredQuestions = QUESTIONS.filter((q) => q);

      // Validate Questions
      if (filteredQuestions.length === 0) {
        return res.status(400).json({ message: "No valid questions provided" });
      }

      // Create the LiveTest
      const liveTest = new LiveTest({
        category,
        date,
        description,
        instructions,
        negativeMarking,
        positiveMarking,
        testName,
        time,
        timeDuration,
        Questions: filteredQuestions,
      });

      const savedTest = await liveTest.save();

      // Send response
      res.status(200).json({
        message: "Test created successfully",
        test: savedTest,
      });
    } catch (error) {
      console.error("Error creating live test:", error);
      res.status(500).json({ message: "Error creating test", error });
    }
  });
};

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
      test_type,
    });
    await newTest.save();

    res.json(created({ message: "Test created successfully", test: newTest }));
  } catch (error) {
    console.error("Error creating test:", error);
    res.json(internalServerError([{ message: "Error creating test" }]));
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
    const updatedTest = await Test.findByIdAndUpdate(testId, req.body, {
      new: true,
    });

    if (!updatedTest) {
      return res.json(notFound([{ message: "Test not found" }]));
    }

    res.json(
      success({ message: "Test updated successfully", test: updatedTest })
    );
  } catch (error) {
    console.error("Error updating test:", error);
    res.json(internalServerError([{ message: "Error updating test" }]));
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
      return res.json(notFound([{ message: "Test not found" }]));
    }

    res.json(success({ message: "Test deleted successfully" }));
  } catch (error) {
    console.error("Error deleting test:", error);
    res.json(internalServerError([{ message: "Error deleting test" }]));
  }
};

exports.getAllTests = async (req, res) => {
  try {
    const { type } = req.query;

    let tests;
    if (type) {
      tests = await Test.find({ test_type: type }).select("-questions");
    } else {
      tests = await Test.find().select("-questions");
    }

    res.json(success({ tests: tests.reverse() }));
  } catch (error) {
    console.error("Error retrieving tests:", error);
    res.json(internalServerError([{ message: "Error retrieving tests" }]));
  }
};

exports.getTestById = async (req, res) => {
  const { testId } = req.params;

  try {
    const test = await Test.findById(testId);

    if (!test) {
      return res.json(notFound([{ message: "Test not found" }]));
    }

    res.json(success({ test }));
  } catch (error) {
    console.error("Error retrieving test:", error);
    res.json(internalServerError([{ message: "Error retrieving test" }]));
  }
};

exports.uploadTest = async (req, res) => {
  try {
    const { name, description, test_type } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "File upload is required" });
    }

    const { value: fileText } = await mammoth.extractRawText({
      path: req.file.path,
    });
    const questions = parseQuestionsAndOptions(fileText);

    // const test = new Test({
    //     name,
    //     description,
    //     questions,
    //     test_type
    // });

    console.log(questions);
    // await test.save();
    res.status(201).json({ message: "Test created successfully", test });
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).json({ message: "Error processing file", error });
  }
};

exports.validateTestResult = async (req, res) => {
  const test = req.body;
  console.log(test);

  if (test.length === 0) {
    return res.status(400).json({
      message: "Please solve some questions...",
    });
  }

  const testId = test[0].testId;
  const userId = test[0].userId;

  try {
    const ans = await AnswersSchema.find({
      $and: [{ testId: testId }, { userId: userId }],
    });

    if (ans.length > 0) {
      return res.status(409).json({ message: "Test is already submitted." });
    }

    // Save answers to database
    let mark = 0;
    let obtainedMarks = 0;
    const savePromises = test.map((t) => {
      const answers = new AnswersSchema({
        questionIndex: t.questionIndex,
        questionId: t.questionId,
        testId: t.testId,
        userId: t.userId,
        userAnswer: t.userAnswer,
        rightAnswer: t.rightAnswer,
        questionStatus: t.questionStatus, // 'correct' or 'incorrect'
        marks: t.marks,
        subject: t.subject,
        type: t.type,
        timeTaken: t.timeTaken,
      });

      obtainedMarks += t.marks;
      if (t.marks > 0) {
        mark = t.marks;
      }

      return answers.save();
    });

    await Promise.all(savePromises);

    // Calculate test statistics
    const correctCount = test.filter(
      (t) => t.questionStatus === "CORRECT"
    ).length;
    const incorrectCount = test.filter(
      (t) => t.questionStatus === "INCORRECT"
    ).length;
    const unansweredCount = test.length - correctCount - incorrectCount;

    const totalTimeTaken = test.reduce((acc, t) => acc + t.timeTaken, 0);
    const totalQuestions = test.length;
    const averageTimePerQuestion =
      totalQuestions > 0 ? totalTimeTaken / totalQuestions : 0;
    const accuracy =
      totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    // Save test statistics
    const testStats = new TestLeaderboard({
      userId,
      testId,
      correctCount,
      incorrectCount,
      unansweredCount,
      accuracy,
      totalTimeTaken,
      averageTimePerQuestion,
      mark,
      obtainedMarks,
    });

    await testStats.save();

    return res.status(200).json({ message: "Data stored successfully." });
  } catch (err) {
    console.error("Error validating test result:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// try {

//   if (!userId) {
//     return res
//       .status(400)
//       .json({ message: "User ID is required to create progress." });
//   }

//   const test = await Test.findById(testId);
//   if (!test) {
//     return res.status(404).json({ message: "Test not found" });
//   }

//   const validationResult = await validateTest(testId, answers, questionTime);

//   const correctCount = validationResult.correctCount;
//   const wrongCount = validationResult.wrongCount;
//   const totalQuestions = validationResult.totalQuestions;
//   const score = validationResult.totalScore; // Use totalScore from validationResult

//   let progress;
//   let isNewProgress = false;
//   if (progressId) {
//     progress = await Progress.findById(progressId);
//     isNewProgress = false;
//   }

//   if (!progress) {
//     progress = new Progress({
//       student: userId,
//       coursesCompleted: [],
//       scores: [],
//       testResults: [],
//       overallScore: 0,
//     });
//     isNewProgress = true;
//   }

//   const courseName = test.name;

//   if (correctCount === totalQuestions) {
//     if (!progress.coursesCompleted.includes(courseName)) {
//       progress.coursesCompleted.push(courseName);
//     }
//   }

//   const existingScoreIndex = progress.scores.findIndex(
//     (item) => item.course === courseName
//   );
//   if (existingScoreIndex !== -1) {
//     progress.scores[existingScoreIndex].score = score;
//   } else {
//     progress.scores.push({ course: courseName, score });
//   }
//   const newResult = progress.testResults.filter(
//     (result) => result.test._id != testId
//   );
//   newResult.push({
//     test: testId,
//     totalQuestions,
//     correctCount,
//     wrongCount,
//     score,
//     dateTaken: Date.now(),
//     correctAnswers: validationResult.correctAnswers,
//     wrongAnswers: validationResult.wrongAnswers,
//     attemptedQuestionIndexes: validationResult.attemptedQuestionIndexes,
//     attemptedQuestionCount: validationResult.attemptedQuestionCount,
//     correctAnswerIndexes: validationResult.correctAnswerIndexes,
//     userAnswers: validationResult.userAnswers,
//     subjectScores: validationResult.subjectScores,
//     timeTaken,
//   });

//   progress.testResults = newResult;

//   const totalScore = progress.scores.reduce(
//     (sum, record) => sum + record.score,
//     0
//   );
//   progress.overallScore = totalScore / progress.scores.length;

//   await progress.save();

//   if (isNewProgress) {
//     await User.findByIdAndUpdate(userId, { progressId: progress._id });
//   }

//   if (!test?.students?.includes(userId)) {
//     test?.students?.push(userId);
//   }
//   test.count = test.students.length;

//   await test.save();

//   let leaderboard = await Leaderboard.findOne({ testId });

//   if (!leaderboard) {
//     leaderboard = new Leaderboard({ testId, entries: [] });
//   }

//   const existingEntryIndex = leaderboard.entries.findIndex(
//     (entry) => entry.studentId.toString() === userId
//   );

//   if (existingEntryIndex !== -1) {
//     leaderboard.entries[existingEntryIndex] = {
//       studentId: userId,
//       score,
//       correctAnswers: correctCount,
//       timeTaken,
//       attemptedQuestions: validationResult.attemptedQuestionCount,
//     };
//   } else {
//     leaderboard.entries.push({
//       studentId: userId,
//       score,
//       correctAnswers: correctCount,
//       timeTaken,
//       attemptedQuestions: validationResult.attemptedQuestionCount,
//     });
//   }

//   leaderboard.entries.sort((a, b) => b.score - a.score);

//   leaderboard.entries.forEach((entry, index) => {
//     entry.rank = index + 1;
//   });

//   await leaderboard.save();

//   res.json(
//     success({
//       validationResult: { ...validationResult, timeTaken },
//       progress,
//     })
//   );
// } catch (error) {
//   console.error("Error updating test progress:", error);
//   res
//     .status(500)
//     .json(internalServerError([{ message: "Error updating test progress" }]));
// }
// };

exports.getTestLeaderboard = async (req, res) => {
  try {
    const { testId } = req.params;

    const leaderboard = await TestLeaderboard.find({ testId });

    if (!leaderboard) {
      return res
        .status(404)
        .json({ message: "Leaderboard not found for this test." });
    }

    res.json({ leaderboard });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ message: "Error fetching leaderboard" });
  }
};
