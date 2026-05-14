const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5005/api/ai';

class AIService {
    async checkHealth() {
        try {
            const response = await axios.get(`${AI_SERVICE_URL}/health`);
            return response.data;
        } catch (error) {
            console.error('AI Service Health Check failed:', error.message);
            throw new Error('AI Service is currently unavailable');
        }
    }

    async chat(message, history = []) {
        try {
            const response = await axios.post(`${AI_SERVICE_URL}/chat`, {
                message,
                messages: history
            });
            return response.data;
        } catch (error) {
            this._handleError(error, 'Chat');
        }
    }

    async summarize(text, length = 'medium', format = 'paragraph') {
        try {
            const response = await axios.post(`${AI_SERVICE_URL}/summarize`, {
                text,
                length,
                format
            });
            return response.data;
        } catch (error) {
            this._handleError(error, 'Summarize');
        }
    }

    async generateQuiz(topic) {
        try {
            const response = await axios.post(`${AI_SERVICE_URL}/quiz`, { topic });
            return response.data;
        } catch (error) {
            this._handleError(error, 'Quiz Generation');
        }
    }

    async getRecommendation(topic) {
        try {
            const response = await axios.post(`${AI_SERVICE_URL}/recommend`, { topic });
            return response.data;
        } catch (error) {
            this._handleError(error, 'Recommendation');
        }
    }

    async analyzeSkillGap(data) {
        try {
            // If data is already the new progress structure, send it directly
            // Otherwise wrap it in 'scores' for backward compatibility with the microservice legacy logic
            const payload = (data.lessonCount !== undefined) ? data : { scores: data };
            
            const response = await axios.post(`${AI_SERVICE_URL}/skill-gap`, payload);
            return response.data;
        } catch (error) {
            this._handleError(error, 'Skill Gap Analysis');
        }
    }

    async analyzeSimilarity(source, target) {
        try {
            const response = await axios.post(`${AI_SERVICE_URL}/similarity`, { source, target });
            return response.data;
        } catch (error) {
            this._handleError(error, 'Similarity Analysis');
        }
    }

    async evaluateProject(title, description) {
        try {
            const response = await axios.post(`${AI_SERVICE_URL}/project-evaluate`, { title, description });
            return response.data;
        } catch (error) {
            this._handleError(error, 'Project Evaluation');
        }
    }

    async aiDetector(text) {
        try {
            const response = await axios.post(`${AI_SERVICE_URL}/ai-detector`, { text });
            return response.data;
        } catch (error) {
            this._handleError(error, 'AI Detection');
        }
    }

    async generatePersona(userData) {
        try {
            const response = await axios.post(`${AI_SERVICE_URL}/persona`, userData);
            return response.data;
        } catch (error) {
            this._handleError(error, 'Persona Generation');
        }
    }

    _handleError(error, action) {
        console.error(`AI Service ${action} error:`, error.response?.data || error.message);
        const detail = error.response?.data?.error || error.message;
        throw new Error(`AI Service failed (${action}): ${detail}`);
    }
}

module.exports = new AIService();
