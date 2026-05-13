const chatbotService = require('../services/chatbotService');
const summarizerService = require('../services/summarizerService');
const recommendationService = require('../services/recommendationService');
const skillGapService = require('../services/skillGapService');
const similarityService = require('../services/similarityService');
const aiDetectorService = require('../services/aiDetectorService');
const quizService = require('../services/quizService');
const pdfParse = require('pdf-parse');

exports.chat = async (req, res) => {
    try {
        const { message, messages } = req.body;
        if (!message && (!messages || messages.length === 0)) return res.status(400).json({ error: 'Message or Messages array is required' });

        // Support either legacy `message` or new modern `messages` memory array
        const history = messages || [{ role: "user", content: message }];
        const response = await chatbotService.generateResponse(history);
        res.json({ response });
    } catch (error) {
        console.error('Chat error:', error.message);
        const detail = error.response?.data || error.message;
        res.status(500).json({ error: detail });
    }
};

exports.summarize = async (req, res) => {
    try {
        const { text, length, format } = req.body;
        if (!text) return res.status(400).json({ error: 'Text is required' });
        const summary = await summarizerService.summarizeText(text, length, format);
        res.json({ summary });
    } catch (error) {
        console.error('Summarize error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.extractText = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No document uploaded' });

        let textContent = '';
        if (req.file.mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf')) {
            const data = await pdfParse(req.file.buffer);
            textContent = data.text;
        } else {
            textContent = req.file.buffer.toString('utf-8');
        }
        res.json({ text: textContent });
    } catch (err) {
        console.error("Extraction error: ", err);
        res.status(500).json({ error: 'Failed extraction: ' + err.message });
    }
};

exports.recommend = async (req, res) => {
    try {
        const { topic } = req.body;
        if (!topic) return res.status(400).json({ error: 'Topic is required' });
        const recommendation = await recommendationService.getRecommendation(topic);
        res.json({ recommendation });
    } catch (error) {
        console.error('Recommend error:', error.message);
        res.status(500).json({ error: 'Failed to generate recommendation' });
    }
};

exports.skillGap = async (req, res) => {
    try {
        const { scores } = req.body;
        if (!scores) return res.status(400).json({ error: 'Scores are required' });
        const analysis = await skillGapService.analyzeSkillGap(scores);
        res.json({ analysis });
    } catch (error) {
        console.error('Skill gap error:', error.message);
        res.status(500).json({ error: 'Failed to analyze skill gap' });
    }
};

exports.similarity = async (req, res) => {
    try {
        const { source, target } = req.body;
        if (!source || !target) return res.status(400).json({ error: 'Source and Target texts are required.' });
        const result = await similarityService.analyzeSimilarity(source, target);
        res.json({ ...result });
    } catch (error) {
        console.error('Similarity error:', error.message);
        res.status(500).json({ error: 'Failed to analyze text similarity' });
    }
};

exports.aiDetector = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'Text is required for AI Detection.' });
        const result = await aiDetectorService.analyzeText(text);
        res.json({ result });
    } catch (error) {
        console.error('AI Detector error:', error.message);
        res.status(500).json({ error: 'Failed to evaluate AI origin probability.' });
    }
};

exports.generateQuiz = async (req, res) => {
    try {
        const { topic } = req.body;
        if (!topic) return res.status(400).json({ error: 'Topic is required.' });
        const result = await quizService.generateQuiz(topic);
        res.json({ result });
    } catch (error) {
        console.error('Quiz Generation error:', error.message);
        res.status(500).json({ error: 'Failed to generate quiz.' });
    }
};

exports.healthCheck = async (req, res) => {
    res.json({ status: 'healthy', service: 'AI Service', port: 5005 });
};
