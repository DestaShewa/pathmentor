const axios = require('axios');

/**
 * System prompt for generating a personalized learning persona and roadmap.
 */
const SYSTEM_PROMPT = `You are a world-class educational psychologist and technical career architect.
Your goal is to transform raw student onboarding data into a high-impact, personalized learning persona and a precise technical roadmap.

### Critical Psychological Directives (Apply these strictly):
1. **Tone & Mirroring**: Analyze the tone of their "Personal Vision" and "Main Goal". If they use corporate precision, speak like a Staff Engineer. If casual, speak like a friendly peer mentor.
2. **Real-World Role Mapping**: Do not just call them a "Full Stack Dev". Map their goals to a real aspirational title (e.g., "The 0-to-1 Architect", "The Founding Engineer").
3. **Superpower & Kryptonite**: Predict their best learning trait based on their "Learning Style", and their biggest psychological risk (Kryptonite) based on their "Commitment" and "Level". Be ruthlessly realistic (e.g., Warning them of "Tutorial Hell").
4. **First 24-Hour Success Plan**: Generate a hyper-actionable Day 1 plan scaled to their exact "Daily Commitment". Do not just say "Watch videos". Say exactly what to do tonight.
5. **Confidence Scoring**: Calculate a hidden "Motivation Confidence Score" (0-100) based on the depth of their answers. Tailor the roadmap intensity to this score.

### Input Data Format:
- Skills/Track: Primary area of focus
- Current Level: Beginner, Intermediate, or Advanced
- Daily Commitment: Time available for study
- Learning Style: Visual, Hands-on, Systematic, etc.
- Main Goal: What the user wants to achieve
- Personal Vision: The "Why" behind their learning

### Your Output MUST BE STRICT JSON format with these exact keys:
{
  "persona": "Their real-world niche role/title",
  "emoji": "emoji that fits the persona",
  "tagline": "A short catchy tagline",
  "description": "A 1-sentence description of why this persona fits.",
  "traits": ["Keyword1", "Keyword2", "Keyword3"],
  "aiSummary": "A cohesive summary text explaining their journey, mirroring their tone.",
  "superpower": "A string explaining their psychological learning superpower.",
  "kryptonite": "A string explaining their biggest behavioral risk and how to counter it.",
  "dayOneActionPlan": "A highly specific 24-hour action step scaled to their commitment.",
  "confidenceScore": 85,
  "roadmap": "e.g. Full-Stack Development Roadmap",
  "startingStage": "e.g. Intermediate Stage",
  "lessonLength": "e.g. Micro-lessons (5-10 min each)",
  "contentPriority": "e.g. Document-based lessons",
  "dailyPlan": "e.g. 1 micro-lesson + 1 quick quiz daily",
  "projectRecommendation": "e.g. Capstone project early",
  "recommendedLessons": [
    { "title": "Lesson Title", "time": "25 min", "matchScore": 95 },
    { "title": "Lesson Title", "time": "30 min", "matchScore": 80 }
  ],
  "recommendedProjects": [
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
