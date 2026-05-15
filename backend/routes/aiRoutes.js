const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const { guard } = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

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
        const { topic, numQuestions, level } = req.body;
        const result = await aiService.generateQuiz(topic, numQuestions, level);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Quiz from uploaded files — server-side file reading (no browser fetch)
router.post('/quiz-from-files', guard, async (req, res) => {
    try {
        const { fileUrls, numQuestions, level } = req.body;
        if (!fileUrls || !Array.isArray(fileUrls) || fileUrls.length === 0) {
            return res.status(400).json({ error: 'At least one file URL is required.' });
        }

        const count = Math.min(Math.max(parseInt(numQuestions) || 5, 5), 20);
        const diff = level || 'intermediate';

        const path = require('path');
        const fs = require('fs');
        const pdfParse = require('pdf-parse');

        // SUPPORTED text-based extensions
        const TEXT_EXTS = ['.txt', '.html', '.htm', '.md', '.csv', '.json', '.xml', '.js', '.ts', '.py', '.java', '.c', '.cpp', '.css'];

        // Read and extract text from each file on disk
        const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
        const extractedTexts = [];
        const skippedFiles = [];

        for (const fileUrl of fileUrls) {
            try {
                // fileUrl looks like: /uploads/lesson-files/filename.pdf
                const relativePath = fileUrl.startsWith('/uploads') ? fileUrl.slice('/uploads'.length) : fileUrl;
                const filePath = path.join(UPLOADS_DIR, relativePath);
                const fileName = path.basename(filePath).toLowerCase();
                const ext = path.extname(fileName);

                if (!fs.existsSync(filePath)) {
                    console.warn(`[QuizRoute] File not found: ${filePath}`);
                    skippedFiles.push(fileName);
                    continue;
                }

                const buffer = fs.readFileSync(filePath);
                let text = '';

                if (ext === '.pdf') {
                    const parsed = await pdfParse(buffer);
                    text = parsed.text;
                } else if (ext === '.docx') {
                    const mammoth = require('mammoth');
                    const parsed = await mammoth.extractRawText({ buffer });
                    text = parsed.value;
                } else if (TEXT_EXTS.includes(ext)) {
                    text = buffer.toString('utf-8');
                } else {
                    // Binary formats (docx, xlsx, pptx, mp4, webm, jpg, etc.) — skip
                    console.warn(`[QuizRoute] Unsupported file type for text extraction: ${fileName}`);
                    skippedFiles.push(fileName);
                    continue;
                }

                // Validate we got meaningful text (not binary noise)
                const cleaned = text.replace(/[^\x20-\x7E\n\r\t\u00C0-\u024F\u0400-\u04FF]/g, '').trim();
                if (cleaned.length < 100) {
                    console.warn(`[QuizRoute] Too little readable text in ${fileName} (${cleaned.length} chars)`);
                    skippedFiles.push(fileName);
                    continue;
                }

                // Smart chunking: keep first 12000 chars per file to fit LLM context
                const chunk = cleaned.slice(0, 12000);
                extractedTexts.push(`=== Material: ${path.basename(filePath)} ===\n${chunk}`);
                console.log(`[QuizRoute] ✓ Extracted ${chunk.length} chars from ${fileName}`);

            } catch (fileErr) {
                console.error(`[QuizRoute] Failed to read ${fileUrl}:`, fileErr.message);
            }
        }

        if (extractedTexts.length === 0) {
            const skipMsg = skippedFiles.length > 0 ? ` Skipped: ${skippedFiles.join(', ')}.` : '';
            return res.status(422).json({ 
                error: `Could not extract readable text from the selected files.${skipMsg} Please upload PDF files ONLY.`
            });
        }

        const fullContext = extractedTexts.join('\n\n---\n\n');
        console.log(`[QuizRoute] Total context length: ${fullContext.length} chars. Generating ${count} questions...`);
        const result = await aiService.generateQuiz(fullContext, count, diff);
        res.json(result);

    } catch (error) {
        console.error('[QuizRoute] quiz-from-files error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Extract text from file proxy (kept for standalone use)
router.post('/extract-text', guard, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const axios = require('axios');
        const FormData = require('form-data');
        const form = new FormData();
        form.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5006/api/ai';
        const response = await axios.post(`${AI_SERVICE_URL}/extract-text`, form, {
            headers: form.getHeaders()
        });

        res.json(response.data);
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
