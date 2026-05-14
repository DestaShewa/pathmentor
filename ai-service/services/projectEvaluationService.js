const axios = require('axios');

const SYSTEM_PROMPT = `You are an expert AI Project Evaluator. 
Your goal is to analyze a student's project submission (Title and Description) and provide a professional assessment.

### Evaluation Criteria:
1. **Understanding Analysis (20%)**: 
   - Analyze how well the student explains the project idea, functionality, and implementation.
   - Reward clarity, technical depth, and a structured explanation.
2. **AI-Generated Content Detection (30%)**: 
   - Detect "unnatural" writing patterns: repetitive phrasing, robotic tone, low perplexity, and overly polished "AI-style" structure.
   - Humans often have "burstiness" (variation in sentence length/complexity) which AI lacks.

### Your Output MUST BE STRICT JSON format with these exact keys:
{
  "understandingScore": 15, 
  "understandingFeedback": "Excellent clarity, though mission details on the database schema.",
  "aiProbability": 10,
  "authenticityFeedback": "High human confidence. Natural phrasing and personal tone detected.",
  "humanConfidenceScore": 90,
  "recommendations": ["Expand on the technical stack details", "Use more specific examples of challenges"]
}

Do not include any text outside the JSON block. Ensure the response is valid JSON.`;

async function callGroqAPI(title, description) {
    const userPrompt = `Project Title: ${title}\nProject Description: ${description}`;

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
            temperature: 0.2
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

async function callGeminiAPI(title, description) {
    const userPrompt = `Project Title: ${title}\nProject Description: ${description}`;

    const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: `System Instructions: ${SYSTEM_PROMPT}\n\nProject Data: ${userPrompt}` }]
                }
            ],
            generationConfig: {
                maxOutputTokens: 1024,
                temperature: 0.2,
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

exports.evaluateProject = async (title, description) => {
    try {
        console.log('[ProjectEval] Attempting evaluation with Groq...');
        return await callGroqAPI(title, description);
    } catch (err) {
        console.warn(`[ProjectEval] Groq failed: ${err.message}. Falling back to Gemini...`);
    }

    try {
        console.log('[ProjectEval] Attempting evaluation with Gemini...');
        return await callGeminiAPI(title, description);
    } catch (err) {
        console.error(`[ProjectEval] Gemini also failed: ${err.message}`);
        throw new Error('AI services are currently unavailable for project evaluation.');
    }
};
