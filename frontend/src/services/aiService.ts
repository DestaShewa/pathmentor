import api from "./api";

export interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

export const aiService = {
    /**
     * Send a message to the AI Mentor
     */
    chat: async (message: string, history: ChatMessage[] = []) => {
        const response = await api.post("/ai/chat", { message, messages: history });
        return response.data;
    },

    /**
     * Summarize a given text
     */
    summarize: async (text: string, length: "short" | "medium" | "long" = "medium", format: "paragraph" | "bullets" = "paragraph") => {
        const response = await api.post("/ai/summarize", { text, length, format });
        return response.data;
    },

    /**
     * Generate a quiz based on a topic or lesson content
     */
    generateQuiz: async (topic: string) => {
        const response = await api.post("/ai/quiz", { topic });
        return response.data;
    },

    /**
     * Analyze skill gap based on assessment scores (Legacy)
     */
    analyzeSkillGap: async (scores: any) => {
        const response = await api.post("/ai/skill-gap", { scores });
        return response.data;
    },

    /**
     * Get AI Skill Gap analysis based on student progress (New)
     */
    getProgressSkillGap: async () => {
        const response = await api.get("/progress/skill-gap");
        return response.data;
    },

    /**
     * Evaluate a project submission (Understanding + AI Detection)
     */
    evaluateProject: async (title: string, description: string) => {
        const response = await api.post("/ai/project-evaluate", { title, description });
        return response.data;
    },

    /**
     * Generate a personalized learning persona
     */
    generatePersona: async (userData: any) => {
        const response = await api.post("/ai/persona", userData);
        return response.data;
    },

    /**
     * Check AI service health
     */
    checkHealth: async () => {
        const response = await api.get("/ai/health");
        return response.data;
    },

    /**
     * Get a learning recommendation based on a topic
     */
    getRecommendation: async (topic: string) => {
        try {
            const response = await api.post("/ai/chat", { 
                message: `Provide a single, short, motivating sentence of advice for a student learning ${topic}. No extra text or quotes.` 
            });
            return {
                recommendation: {
                    suggestion: response.data?.response || response.data || "Keep practicing and building projects to solidify your knowledge."
                }
            };
        } catch (error) {
            return {
                recommendation: {
                    suggestion: "Focus on completing your assigned lessons first, then practice building small projects to cement your understanding."
                }
            };
        }
    }
};

export default aiService;
