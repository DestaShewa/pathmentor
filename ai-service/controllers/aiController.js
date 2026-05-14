const chatbotService = require('../services/chatbotService');
const summarizerService = require('../services/summarizerService');
const skillGapService = require('../services/skillGapService');
const quizService = require('../services/quizService');
const projectEvaluationService = require('../services/projectEvaluationService');
const personaService = require('../services/personaService');
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



exports.skillGap = async (req, res) => {
    try {
        console.log('[SkillGap] Received request body:', JSON.stringify(req.body));
        let progressData = req.body;

        // Backward compatibility for legacy "scores" input from ProgressPage or old backend calls
        if (progressData.scores && !progressData.lessonCount) {
            console.log('[SkillGap] Detected legacy scores format. Converting...');
            const scores = progressData.scores;
            progressData = {
                lessonCount: scores.lessonCount || 0,
                xp: scores.xp || 0,
                completion: scores.completion || scores["Overall Progress"] || scores["Progress"] || 0,
                studyHours: scores.studyHours || 0,
                masteryTopics: scores.masteryTopics || Object.keys(scores).filter(k => k !== "Overall Progress")
            };
            console.log('[SkillGap] Converted progressData:', JSON.stringify(progressData));
        }

        if (!progressData.lessonCount && progressData.lessonCount !== 0) {
            console.error('[SkillGap] Invalid progress data - lessonCount missing');
            return res.status(400).json({ error: 'Progress data is required' });
        }

        const analysis = await skillGapService.analyzeSkillGap(progressData);
        
        // Ensure we handle different response formats from the service if needed
        // For ProgressPage.tsx compatibility, we might want to provide a fallback string insights
        if (analysis && analysis.insights && typeof analysis.insights === 'object') {
            analysis.insightsString = `${analysis.insights.performanceGap}\n\nStrategy: ${analysis.insights.strategy}`;
        }

        console.log('[SkillGap] Analysis successful');
        res.json({ analysis });
    } catch (error) {
        console.error('[SkillGap] Critical error:', error);
        res.status(500).json({ error: 'Failed to analyze skill gap: ' + error.message });
    }
};

exports.evaluateProject = async (req, res) => {
    try {
        const { title, description } = req.body;
        if (!title || !description) {
            return res.status(400).json({ error: 'Title and description are required' });
        }
        const evaluation = await projectEvaluationService.evaluateProject(title, description);
        res.json({ success: true, evaluation });
    } catch (error) {
        console.error('Project evaluation error:', error.message);
        res.status(500).json({ error: 'Failed to evaluate project: ' + error.message });
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

exports.generatePersona = async (req, res) => {
    try {
        const userData = req.body;
        if (!userData.skillTrack || !userData.experienceLevel) {
            return res.status(400).json({ error: 'Incomplete learning profile data' });
        }
        const result = await personaService.generatePersona(userData);
        res.json({ result });
    } catch (error) {
        console.error('Persona Generation error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.healthCheck = async (req, res) => {
    res.json({ status: 'healthy', service: 'AI Service', port: 5005 });
};
