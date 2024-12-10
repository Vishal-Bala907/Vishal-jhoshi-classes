const Test = require('../models/Test');

exports.parseQuestionsAndOptions = (fileText) => {
    const questions = [];

    const questionRegex = /Q\d+:\s(.+?)(?=Q\d+:|$)/gs;
    const optionRegex = /([A-D])\)\s(.+?)(?=\n|$)/g;
    const answerRegex = /Answer:\s([A-D])/g;

    let match;
    while ((match = questionRegex.exec(fileText)) !== null) {
        const questionText = match[1].trim();
        const options = [];
        let answerMatch = answerRegex.exec(fileText);

        let optionMatch;
        while ((optionMatch = optionRegex.exec(fileText)) !== null) {
            options.push({
                text: optionMatch[2].trim(),
                isCorrect: answerMatch && answerMatch[1] === optionMatch[1]
            });
        }

        questions.push({
            questionText,
            options
        });
    }

    return questions;
}

exports.validateTest = async (testId, userAnswers, questionTime) => {
    try {
        const test = await Test.findById(testId);
        if (!test) {
            throw new Error("Test not found");
        }

        let correctCount = 0;
        let wrongCount = 0;
        let totalScore = 0; // Initialize total score
        const correctAnswers = [];
        const correctAnswerIndexes = [];
        const wrongAnswers = [];
        const subjectScores = {}; // To calculate subject-wise scores.

        const attemptedQuestionIndexes = userAnswers
            .map((answer, index) => answer !== false ? index : -1)
            .filter(index => index !== -1);

        test.questions.forEach((question, index) => {
            const correctOptionIndex = question.options.findIndex(option => option.isCorrect);
            const userAnswer = userAnswers[index];
            const userTiming = questionTime[index]

            const answerObject = {
                questionText: question.question,
                timeTaken: userTiming,
                userAnswer: userAnswer !== undefined ? userAnswer.toString() : null,
                correctAnswer: correctOptionIndex !== undefined ? correctOptionIndex.toString() : null,
            };

            if (userAnswer === correctOptionIndex) {
                correctCount++;
                correctAnswerIndexes.push(index);
                correctAnswers.push(answerObject); // Push object instead of index
                totalScore += 4; // Add +4 for correct answer
            } else if (userAnswer !== undefined) {
                wrongCount++;
                wrongAnswers.push(answerObject); // Push object instead of index
                totalScore -= 1; // Deduct -1 for incorrect answer
            }

            // Track subject scores
            if (!subjectScores[question.subject]) {
                subjectScores[question.subject] = { count: 0, correct: 0, subjectScore: 0 };
            }
            subjectScores[question.subject].count++;
            if (userAnswer === correctOptionIndex) {
                subjectScores[question.subject].correct++;
                subjectScores[question.subject].subjectScore += 4; // +4 for correct
            } else if (userAnswer !== undefined) {
                subjectScores[question.subject].subjectScore -= 1; // -1 for incorrect
            }
        });

        const totalQuestions = test.questions.length;
        const subjectScoreList = Object.keys(subjectScores).map(subject => ({
            subject,
            score: Math.round((subjectScores[subject].subjectScore / (subjectScores[subject].count * 4)) * 100), // Percentage score
        }));

        return {
            correctCount,
            wrongCount,
            totalQuestions,
            correctAnswers,
            wrongAnswers,
            attemptedQuestionIndexes,
            attemptedQuestionCount: attemptedQuestionIndexes.length,
            totalScore, // Return total score
            subjectScores: subjectScoreList,
            userAnswers,
            correctAnswerIndexes
        };
    } catch (error) {
        console.error('Error validating test:', error);
        throw new Error('Error validating test');
    }
};
