const axios = require('axios');

// ─── System Prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are PathMentor AI — an expert programming mentor and career advisor.
Your responsibilities:
• Explain concepts simply and clearly with real-world analogies.
• Debug and fix code when given, explaining what went wrong.
• Guide students on career paths, skill gaps, and learning roadmaps.
• Format all responses using clean Markdown (headings, bullet points, code blocks).
• Be encouraging, concise, and professional.`;

// ─── Smart Routing Helper ─────────────────────────────────────────────────────
/**
 * Determines which API to try FIRST based on the user's prompt content.
 * - Code-heavy / technical prompts → Gemini (stronger at code)
 * - General / career / conversation prompts → Groq (faster)
 */
function pickPrimaryAPI(prompt) {
    const lastUserMessage = Array.isArray(prompt)
        ? (prompt.filter(m => m.role === 'user').pop()?.content || '').toLowerCase()
        : prompt.toLowerCase();

    const codeKeywords = [
        'code', 'debug', 'error', 'function', 'class', 'algorithm',
        'bug', 'fix', 'syntax', 'compile', 'runtime', 'exception',
        'javascript', 'python', 'java', 'typescript', 'react', 'node',
    ];
    const isCodeRequest = codeKeywords.some(kw => lastUserMessage.includes(kw));

    return isCodeRequest ? 'gemini' : 'groq';
}

// ─── Groq API Caller ──────────────────────────────────────────────────────────
async function callGroqAPI(historyArray) {
    const payloadMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...historyArray,
    ];

    const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
            model: 'llama-3.3-70b-versatile',
            messages: payloadMessages,
            max_tokens: 1024,
            temperature: 0.7,
            top_p: 0.9,
            frequency_penalty: 0.1,
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('Groq returned empty content');
    return content;
}

// ─── Gemini API Caller ────────────────────────────────────────────────────────
async function callGeminiAPI(historyArray) {
    // Build Gemini's "contents" format from chat history
    const contents = historyArray.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
    }));

    // Prepend system instruction as a leading user turn (Gemini REST approach)
    const systemTurn = {
        role: 'user',
        parts: [{ text: `[System Instructions] ${SYSTEM_PROMPT}` }],
    };
    const modelAck = {
        role: 'model',
        parts: [{ text: 'Understood. I am PathMentor AI, ready to help.' }],
    };

    const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
            contents: [systemTurn, modelAck, ...contents],
            generationConfig: {
                maxOutputTokens: 1024,
                temperature: 0.7,
                topP: 0.9,
            },
        },
        {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000,
        }
    );

    const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error('Gemini returned empty content');
    return content;
}

// ─── Main Export: Dual-API Fallback with Smart Routing ───────────────────────
exports.generateResponse = async (historyArray) => {
    const primary = pickPrimaryAPI(historyArray);
    const secondary = primary === 'groq' ? 'gemini' : 'groq';

    const apiFunctions = {
        groq: callGroqAPI,
        gemini: callGeminiAPI,
    };

    // --- Attempt 1: Primary API ---
    try {
        console.log(`[Chatbot] Routing to primary API: ${primary.toUpperCase()}`);
        const result = await apiFunctions[primary](historyArray);
        console.log(`[Chatbot] ✓ ${primary.toUpperCase()} responded successfully.`);
        return result;
    } catch (primaryError) {
        console.warn(`[Chatbot] ✗ ${primary.toUpperCase()} failed: ${primaryError.message}`);
    }

    // --- Attempt 2: Secondary API (fallback) ---
    try {
        console.log(`[Chatbot] Falling back to secondary API: ${secondary.toUpperCase()}`);
        const result = await apiFunctions[secondary](historyArray);
        console.log(`[Chatbot] ✓ ${secondary.toUpperCase()} responded successfully (fallback).`);
        return result;
    } catch (secondaryError) {
        console.error(`[Chatbot] ✗ ${secondary.toUpperCase()} also failed: ${secondaryError.message}`);
    }

    // --- Attempt 3: Both APIs exhausted ---
    console.error('[Chatbot] Both AI services failed. Returning user-friendly message.');
    return 'Both AI services are currently unavailable. Please try again in a moment.';
};
