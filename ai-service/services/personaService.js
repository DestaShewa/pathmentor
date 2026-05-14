const axios = require('axios');

/**
 * System prompt for generating a personalized learning persona and roadmap.
 */
const SYSTEM_PROMPT = `You are a world-class educational psychologist and technical career architect.
Your goal is to transform raw student onboarding data into a high-impact, personalized learning persona and a precise technical roadmap.

### Input Data Format:
- Skills/Track: Primary area of focus
- Current Level: Beginner, Intermediate, or Advanced
- Daily Commitment: Time available for study
- Learning Style: Visual, Hands-on, Systematic, etc.
- Main Goal: What the user wants to achieve
- Personal Vision: The "Why" behind their learning

### Your Output MUST BE STRICTOR JSON format with these exact keys:
{
  "persona": "The name of the persona (e.g. The Explorer)",
  "tagline": "A short catchy tagline (e.g. Curious Adventurer)",
  "description": "A 1-sentence description of why this persona fits.",
  "keywords": ["Keyword1", "Keyword2", "Keyword3"],
  "summary": "A cohesive summary text explaining the journey.",
  "roadmap": {
    "startingStage": "e.g. Intermediate Stage",
    "lessonFormat": "e.g. Micro-lessons (5-10 min each)",
    "contentStyle": "e.g. Document-based lessons",
    "dailyPlan": "e.g. 1 micro-lesson + 1 quick quiz daily",
    "projectFocus": "e.g. Capstone project early"
  },
  "firstLessons": [
    { "title": "Lesson Title", "time": "25 min", "matchScore": 95 },
    { "title": "Lesson Title", "time": "30 min", "matchScore": 80 }
  ],
  "projects": [
    { "title": "Project Title", "description": "Short project description" },
    { "title": "Project Title", "description": "Short project description" }
  ],
  "recommendation": "A short, motivating closing advice."
}

Do not include any text outside the JSON block. Ensure the response is valid JSON.`;

// ─── Groq API Caller ──────────────────────────────────────────────────────────
async function callGroqAPI(userData) {
    const userPrompt = `Generate a personalized learning persona for:
    - Skills/Track: ${userData.skillTrack}
    - Level: ${userData.experienceLevel}
    - Commitment: ${userData.commitmentTime}
    - Style: ${userData.learningStyle}
    - Goal: ${userData.learningGoal}
    - Vision: ${userData.personalGoal}`;

    const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: userPrompt }
            ],
            response_format: { type: "json_object" },
            max_tokens: 1024,
            temperature: 0.7
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
    return JSON.parse(content);
}

// ─── Gemini API Caller ────────────────────────────────────────────────────────
async function callGeminiAPI(userData) {
    const userPrompt = `Generate a personalized learning persona for:
    - Skills/Track: ${userData.skillTrack}
    - Level: ${userData.experienceLevel}
    - Commitment: ${userData.commitmentTime}
    - Style: ${userData.learningStyle}
    - Goal: ${userData.learningGoal}
    - Vision: ${userData.personalGoal}`;

    // Gemini REST approach requires system prompt in parts or instructions if supported
    const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: `System Instructions: ${SYSTEM_PROMPT}\n\nUser Data: ${userPrompt}` }]
                }
            ],
            generationConfig: {
                maxOutputTokens: 1024,
                temperature: 0.7,
                response_mime_type: "application/json"
            }
        },
        {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000,
        }
    );

    const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error('Gemini returned empty content');
    return JSON.parse(content);
}

/**
 * Main Export: Persona Generation with Dual-API Fallback
 */
exports.generatePersona = async (userData) => {
    // Attempt 1: Groq
    try {
        console.log('[Persona] Attempting generation with Groq...');
        return await callGroqAPI(userData);
    } catch (err) {
        console.warn(`[Persona] Groq failed: ${err.message}. Falling back to Gemini...`);
    }

    // Attempt 2: Gemini
    try {
        console.log('[Persona] Attempting generation with Gemini...');
        return await callGeminiAPI(userData);
    } catch (err) {
        console.error(`[Persona] Gemini also failed: ${err.message}`);
        throw new Error('AI services are currently unavailable for persona generation.');
    }
};
