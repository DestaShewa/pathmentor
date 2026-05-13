const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/chat', aiController.chat);
router.post('/summarize', aiController.summarize);
router.post('/extract-text', upload.single('file'), aiController.extractText);
router.post('/recommend', aiController.recommend);
router.post('/skill-gap', aiController.skillGap);
router.post('/similarity', aiController.similarity);
router.post('/ai-detector', aiController.aiDetector);
router.post('/quiz', aiController.generateQuiz);
router.get('/health', aiController.healthCheck);

module.exports = router;
