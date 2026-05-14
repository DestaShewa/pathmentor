const axios = require('axios');

/**
 * System prompt for analyzing skill gaps based on user progress.
 */
const SYSTEM_PROMPT = `You are an expert AI Learning Architect. 
Your goal is to perform a deep "Skill Gap Analysis" for a student based on their learning progress data.

### Input Data:
- Lessons Completed: Count and titles
- Total XP: Experience points earned
- Course Completion%: Current progress
- Study Time: Total hours invested
- Mastery Topics: Topics the user performed well in (quizzes/tasks)

### Your Output MUST BE STRICTOR JSON format with these exact keys:
{
  "strengths": ["Strengths 1", "Strength 2"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "recommendations": ["Advice 1", "Advice 2"],
  "nextTopics": [
     { "title": "Topic Title", "reason": "Why this topic is next" }
  ],
  "insights": {
     "performanceGap": "Analysis of current vs expected performance",
     "learningPattern": "Observation about how the user learns",
     "strategy": "A specific study strategy for the user"
  }
}

Do not include any text outside the JSON block. Ensure the response is valid JSON.`;

async function callGroqAPI(progressData) {
    const userPrompt = `Analyze skill gap for:
    - Lessons Completed: ${progressData.lessonCount}
    - XP Earned: ${progressData.xp}
    - Completion: ${progressData.completion}%
    - Study Time: ${progressData.studyHours}h
    - mastery: ${progressData.masteryTopics?.join(', ')}`;

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

async function callGeminiAPI(progressData) {
    const userPrompt = `Analyze skill gap for:
    - Lessons Completed: ${progressData.lessonCount}
    - XP Earned: ${progressData.xp}
    - Completion: ${progressData.completion}%
    - Study Time: ${progressData.studyHours}h
    - mastery: ${progressData.masteryTopics?.join(', ')}`;

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

exports.analyzeSkillGap = async (progressData) => {
    try {
        console.log('[SkillGap] Attempting analysis with Groq...');
        return await callGroqAPI(progressData);
    } catch (err) {
        console.warn(`[SkillGap] Groq failed: ${err.message}. Falling back to Gemini...`);
    }

    try {
        console.log('[SkillGap] Attempting analysis with Gemini...');
        return await callGeminiAPI(progressData);
    } catch (err) {
        console.error(`[SkillGap] Gemini also failed: ${err.message}`);
        throw new Error('AI services are currently unavailable for skill gap analysis.');
    }
};
