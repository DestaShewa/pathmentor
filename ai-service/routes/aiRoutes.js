const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/chat', aiController.chat);
router.post('/summarize', aiController.summarize);
router.post('/extract-text', upload.single('file'), aiController.extractText);
router.post('/skill-gap', aiController.skillGap);
router.post('/quiz', aiController.generateQuiz);
router.post('/persona', aiController.generatePersona);
router.get('/health', aiController.healthCheck);

// Project Evaluation
router.post('/project-evaluate', aiController.evaluateProject);

module.exports = router;
