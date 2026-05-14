const axios = require('axios');

/**
 * Advanced Quiz Service with Dual-API Fallback
 * Generates 5 high-quality multiple choice questions in JSON format.
 */

const systemPrompt = `You are an expert educator. Generate a set of 5 multiple-choice questions about the topic provided. 
Your response MUST be a valid JSON array of objects. Do not include any text before or after the JSON.
Each object must have:
- question: (string)
- options: (array of 4 strings)
- correctAnswer: (number, 0-3 representing the index of the correct option)

Example Format:
[
  {
    "question": "What is...?",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": 0
  }
]`;

/**
 * Cleans a potential JSON string from common LLM syntax errors
 * (trailing commas, comments, etc.)
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
    }

    // 2. Clean common LLM syntax errors
    cleanText = cleanJSONString(cleanText);

    try {
        return JSON.parse(cleanText);
    } catch (e) {
        // Last ditch effort: if it's not JSON, try to find an array pattern [...]
        const arrayMatch = cleanText.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (arrayMatch) {
            try {
                return JSON.parse(cleanJSONString(arrayMatch[0]));
            } catch (e2) {
                // fall through
            }
        }
        throw new Error(`Failed to parse JSON: ${e.message}`);
    }
}

async function callGemini(topic) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    // Syncing with the working model name and endpoint from chatbotService
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await axios.post(url, {
        contents: [{
            parts: [{ text: `${systemPrompt}\n\nTopic: ${topic}` }]
        }],
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
        }
    });

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini returned empty response");
    return extractJSON(text);
}

async function callGroq(topic) {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Generate a 5-question quiz about: ${topic}. Respond ONLY with a JSON array.` }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1,
        },
        {
            headers: {
                Authorization: `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json",
            }
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

exports.generateQuiz = async (topic) => {
    console.log(`[QuizService] Generating quiz for: ${topic}`);

    try {
        // Primary: Gemini (Better at following JSON schema)
        const result = await callGemini(topic);
        console.log("[QuizService] Generated via Gemini");
        return { result, method: "Gemini 1.5 Flash (Educational Grade)" };
    } catch (err) {
        console.warn("[QuizService] Gemini failed, falling back to Groq:", err.message);

        try {
            // Secondary Fallback: Groq (Llama 3)
            const result = await callGroq(topic);
            console.log("[QuizService] Generated via Groq Fallback");
            return { result, method: "Groq Llama-3 (High Speed Fallback)" };
        } catch (groqErr) {
            console.error("[QuizService] All API sources failed:", groqErr.message);
            throw new Error("Unable to generate quiz questions at this time.");
        }
    }
};
