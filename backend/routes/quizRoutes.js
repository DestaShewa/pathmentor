const express = require("express");
const router = express.Router();

const { guard, authorize } = require("../middleware/authMiddleware");

const { createQuiz, getQuizByLesson, submitQuiz } = require("../controllers/quizController");

router.post("/", guard, authorize("mentor","admin"), createQuiz);

router.get("/lesson/:lessonId", getQuizByLesson);

router.post("/:quizId/submit", guard, submitQuiz);

module.exports = router;