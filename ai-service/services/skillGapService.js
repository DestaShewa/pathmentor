const axios = require('axios');

exports.analyzeSkillGap = async (scores) => {
    // Rule-based score analysis
    // Expected: scores = { react: 40, node: 85, python: 30 }
    const weakAreas = [];

    if (scores && typeof scores === 'object') {
        for (const [skill, score] of Object.entries(scores)) {
            if (typeof score === 'number' && score < 50) {
                weakAreas.push(skill);
            }
        }
    }

    if (weakAreas.length === 0) {
        return { insights: "No significant skill gaps found. Keep up the good work!", weakAreas: [] };
    }

    const systemPrompt = `You are an expert tech mentor. 
Your job is to provide a "Skill Gap Analysis" based on the student's scores. 
You MUST format your output strictly into these 3 sections:
### 1. Analyze Quiz Results
(Briefly summarize their overall performance across all skills provided)

### 2. Identify Weak Areas
(Explain why their specific weaknesses: ${weakAreas.join(", ")} are critical to improve)

### 3. Suggest Improvement Path
(Give a step-by-step roadmap and project ideas to level up these specific skills)`;

    const userPrompt = `The student scored the following: ${JSON.stringify(scores)}. Their weak areas are: ${weakAreas.join(", ")}. Provide the Skill Gap Analysis following the 3 sections precisely.`;

    try {
        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                max_tokens: 700,
                temperature: 0.7
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json",
                },
                timeout: 30000,
            }
        );

        let advice = response.data?.choices?.[0]?.message?.content || JSON.stringify(response.data);

        return { insights: advice, weakAreas };

    } catch (err) {
        const status = err.response?.status;
        const hfError = err.response?.data?.error;
        console.error(`[SkillGap] Status: ${status}. Error: ${hfError}`);

        // Fallback to rule-based message if AI fails
        return {
            insights: `You need to focus and improve in: ${weakAreas.join(", ")}. Practice daily exercises and review fundamentals.`,
            weakAreas,
            method: "rule-based-fallback"
        };
    }
};
