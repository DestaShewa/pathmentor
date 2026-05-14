const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const { guard } = require('../middleware/authMiddleware');

// Health check proxy
router.get('/health', async (req, res) => {
    try {
        const health = await aiService.checkHealth();
        res.json(health);
    } catch (error) {
        res.status(503).json({ error: error.message });
    }
});

// Chat proxy
router.post('/chat', guard, async (req, res) => {
    try {
        const { message, messages } = req.body;
        const result = await aiService.chat(message, messages);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Summarize proxy
router.post('/summarize', guard, async (req, res) => {
    try {
        const { text, length, format } = req.body;
        const result = await aiService.summarize(text, length, format);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Quiz proxy
router.post('/quiz', guard, async (req, res) => {
    try {
        const { topic } = req.body;
        const result = await aiService.generateQuiz(topic);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Skill Gap proxy
router.post('/skill-gap', guard, async (req, res) => {
    try {
        const { scores } = req.body;
        const result = await aiService.analyzeSkillGap(scores);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



// Persona proxy
router.post('/persona', guard, async (req, res) => {
    try {
        const result = await aiService.generatePersona(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
