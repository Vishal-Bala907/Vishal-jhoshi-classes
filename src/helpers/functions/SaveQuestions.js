const TestQuestion = require("../../models/IntegerTypeQuestions");
const SelectTypeQuestions = require("../../models/SelectTypeQuestions");

/**
 * Processes and saves a question to the database.
 * @param {Object} questionData - The question object from the request.
 * @returns {Object|null} - Returns saved question metadata or null if invalid.
 */
exports.saveQuestion = async (questionData) => {
  try {
    // Validate if question type is "integer"
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
      // Create and save question
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
      // handle all non image single select MCQ
      const {
        correctAnswer,
        description,
        descriptionImage,
        imageOptions,
        level,
        optionType,
        subject,
        subtopic,
        textOptions,
        topic,
        type,
      } = questionData;

      let DESCRIPTIONIMAGE = null;

      if (descriptionImage !== null) {
        // handle the image
      } else if (optionType === "text") {
        // handle only text options

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

        // save the question
        const savedQuestion = await selectTypeQuestion.save();
        return {
          questionId: savedQuestion._id,
          questionType: type,
        };
      } else {
        // handle textImage options
      }
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error saving question:", error);
    return null; // Return null in case of an error
  }
};
