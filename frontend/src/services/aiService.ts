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
     * Get AI-powered course recommendations
     */
    getRecommendation: async (topic: string) => {
        const response = await api.post("/ai/recommend", { topic });
        return response.data;
    },

    /**
     * Analyze skill gap based on assessment scores
     */
    analyzeSkillGap: async (scores: any) => {
        const response = await api.post("/ai/skill-gap", { scores });
        return response.data;
    },

    /**
     * Analyze similarity between two texts
     */
    analyzeSimilarity: async (source: string, target: string) => {
        const response = await api.post("/ai/similarity", { source, target });
        return response.data;
    },

    /**
     * Check if text is AI-generated
     */
    aiDetector: async (text: string) => {
        const response = await api.post("/ai-detector", { text });
        return response.data;
    },

    /**
     * Check AI service health
     */
    checkHealth: async () => {
        const response = await api.get("/ai/health");
        return response.data;
    }
};

export default aiService;
