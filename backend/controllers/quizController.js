const Quiz = require("../models/Quiz");
const Lesson = require("../models/Lesson");
const asyncHandler = require("../middleware/asyncHandler");
const { logActivity } = require("../utils/activityLogger");
const { updateLevelScore } = require("./progressController");
const createQuiz = asyncHandler(async (req, res) => {

  const quiz = await Quiz.create({
    lesson: req.body.lessonId,
    questions: req.body.questions
  });

  logActivity({
    user: req.user._id,
    type: "QUIZ_SUBMITTED",
    message: `User created a quiz`
  }).catch(() => {});

  res.status(201).json({
    success: true,
    data: quiz
  });
});

const getQuizByLesson = asyncHandler(async (req, res) => {

  const quiz = await Quiz.findOne({
    lesson: req.params.lessonId
  });

  res.json({
    success: true,
    data: quiz
  });

});

const adminGetQuizzes = asyncHandler(async (req, res) => {
  const quizzes = await Quiz.find().populate("course");
  res.json(quizzes);
});

const adminDeleteQuiz = asyncHandler(async (req, res) => {
  await Quiz.findByIdAndDelete(req.params.id);
  res.json({ message: "Quiz deleted" });
});

// Submit quiz answers and calculate score
const submitQuiz = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const { answers } = req.body; // answers should be array of numbers (selected option indices)

  if (!answers || !Array.isArray(answers)) {
    res.status(400);
    throw new Error("Answers must be provided as an array");
  }

  const quiz = await Quiz.findById(quizId).populate("lesson");
  if (!quiz) {
    res.status(404);
    throw new Error("Quiz not found");
  }

  if (answers.length !== quiz.questions.length) {
    res.status(400);
    throw new Error(`Expected ${quiz.questions.length} answers, got ${answers.length}`);
  }

  // Calculate score
  let correctCount = 0;
  const results = quiz.questions.map((question, index) => {
    const userAnswer = answers[index];
    const isCorrect = userAnswer === question.correctAnswer;
    if (isCorrect) correctCount++;

    return {
      questionIndex: index,
      question: question.question,
      userAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect
    };
  });

  const scorePercentage = Math.round((correctCount / quiz.questions.length) * 100);
  const passed = scorePercentage >= 80; // 80% required to pass

  // Update level score in progress
  const lesson = quiz.lesson;
  if (lesson && lesson.level && lesson.course) {
    try {
      const Progress = require("../models/Progress");
      const progress = await Progress.findOne({
        user: req.user._id,
        course: lesson.course
      });

      if (progress) {
        let levelProgress = progress.levelsProgress.find(
          lp => lp.level.toString() === lesson.level.toString()
        );

        if (!levelProgress) {
          levelProgress = {
            level: lesson.level,
            completedLessons: [],
            score: 0,
            isCompleted: false
          };
          progress.levelsProgress.push(levelProgress);
        }

        // Update score (keep highest score)
        if (scorePercentage > levelProgress.score) {
          levelProgress.score = scorePercentage;
        }

        // Check if level should be marked as completed
        const Level = require("../models/Level");
        const totalLessons = await Lesson.countDocuments({ level: lesson.level });
        if (levelProgress.completedLessons.length === totalLessons && scorePercentage >= 80) {
          levelProgress.isCompleted = true;
        }

        await progress.save();
      }
    } catch (err) {
      console.error("Failed to update level score:", err);
      // Don't fail the quiz submission if level score update fails
    }
  }

  // Log activity
  logActivity({
    user: req.user._id,
    type: "QUIZ_COMPLETED",
    message: `${req.user.name} completed quiz with ${scorePercentage}% score`
  }).catch(() => {});

  res.json({
    success: true,
    data: {
      quizId,
      scorePercentage,
      correctCount,
      totalQuestions: quiz.questions.length,
      passed,
      results
    }
  });
});

module.exports = {
  createQuiz, 
  getQuizByLesson,
  adminGetQuizzes,
  adminDeleteQuiz,
  submitQuiz
};