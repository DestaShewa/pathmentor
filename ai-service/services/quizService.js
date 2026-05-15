const axios = require('axios');

/**
 * Advanced Quiz Service with Dual-API Fallback
 * Generates a set of multiple-choice questions in JSON format.
 */

const getSystemPrompt = (numQuestions = 5, level = "intermediate") => `You are an expert educator.
The student has uploaded specific lesson materials. Your task is to generate exactly ${numQuestions} multiple-choice quiz questions STRICTLY based on the content provided below.

CRITICAL RULES:
- You MUST only generate questions about information that appears in the provided lesson material.
- Do NOT use any external or general knowledge. Every question must be directly answerable from the provided text.
- The difficulty level should be: ${level}.
- Each question must have exactly 4 distinct answer options.

Your response MUST be a valid JSON array of objects. Do not include any text before or after the JSON.
Each object must have:
- question: (string) A specific question derived from the content
- options: (array of exactly 4 strings)
- correctAnswer: (number, 0-3 representing the index of the correct option)
- explanation: (string) A brief explanation citing the relevant part of the lesson material

Example Format:
[
  {
    "question": "According to the material, what is...?",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": 0,
    "explanation": "The material states that Option A is correct because..."
  }
]`;

/**
 * Cleans a potential JSON string from common LLM syntax errors
 */
function cleanJSONString(jsonString) {
    if (!jsonString) return "";
    return jsonString
        .replace(/\/\/.*$/gm, "") // Remove // comments
        .replace(/\/\*[\s\S]*?\*\//g, "") // Remove /* */ comments
        .replace(/,\s*([\]}])/g, "$1") // Remove trailing commas
        .trim();
}

/**
 * Helper to extract JSON from a string that might contain markdown blocks
 */
function extractJSON(text) {
    if (!text) throw new Error("Empty input for JSON extraction");

    let cleanText = text;
    // 1. Find content between ```json and ``` or ``` and ```
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
        cleanText = match[1];
    } else {
        // Find the first [ and last ]
        const firstBracket = text.indexOf('[');
        const lastBracket = text.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1) {
            cleanText = text.substring(firstBracket, lastBracket + 1);
        }
    }

    // 2. Clean common LLM syntax errors
    cleanText = cleanJSONString(cleanText);

    try {
        return JSON.parse(cleanText);
    } catch (e) {
        throw new Error(`Failed to parse JSON: ${e.message}`);
    }
}

async function callGemini(topic, numQuestions, level) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await axios.post(url, {
        contents: [{
            parts: [{ text: `${getSystemPrompt(numQuestions, level)}\n\nContext/Topic: ${topic}` }]
        }],
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096
        }
    }, { timeout: 60000 });

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini returned empty response");
    return extractJSON(text);
}

async function callGroq(topic, numQuestions, level) {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: getSystemPrompt(numQuestions, level) },
                { role: "user", content: `Generate a ${numQuestions}-question quiz about: ${topic}. Respond ONLY with a JSON array.` }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1,
            max_tokens: 4096
        },
        {
            headers: {
                Authorization: `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json",
            },
            timeout: 45000
        }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    const parsed = extractJSON(content);

    // Robust extraction for various object wrappers
    if (Array.isArray(parsed)) return parsed;
    if (parsed.questions && Array.isArray(parsed.questions)) return parsed.questions;
    if (parsed.quiz && Array.isArray(parsed.quiz)) return parsed.quiz;

    const firstArrayKey = Object.keys(parsed).find(key => Array.isArray(parsed[key]));
    if (firstArrayKey) return parsed[firstArrayKey];

    return [];
}

exports.generateQuiz = async (topic, numQuestions, level) => {
    console.log(`[QuizService] Generating ${numQuestions} questions (${level}) for: ${topic.substring(0, 50)}...`);

    try {
        // Primary: Gemini (Better at following JSON schema and larger context)
        const result = await callGemini(topic, numQuestions, level);
        console.log("[QuizService] Generated via Gemini");
        return { result, method: "Gemini 1.5 Flash (Educational Grade)" };
    } catch (err) {
        console.warn("[QuizService] Gemini failed, falling back to Groq:", err.message);

        try {
            // Secondary Fallback: Groq (Llama 3)
            const result = await callGroq(topic, numQuestions, level);
            console.log("[QuizService] Generated via Groq Fallback");
            return { result, method: "Groq Llama-3 (High Speed Fallback)" };
        } catch (groqErr) {
            console.error("[QuizService] All API sources failed:", groqErr.message);
            throw new Error("Unable to generate quiz questions at this time.");
        }
    }
};

