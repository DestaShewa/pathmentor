const axios = require('axios');

exports.getRecommendation = async (topic) => {
    const systemPrompt = `You are a smart technical recommendation system.
You MUST format your output strictly into these 3 sections based on the user's topic input:
### 1. Suggest Next Lessons
(What they should study next regarding the topic)

### 2. Recommend Weak-Topic Revision
(Core fundamentals they must revise)

### 3. Suggest Relevant Projects
(Project ideas to build)`;

    const userPrompt = `I want to learn about and need recommendations for the following topic: ${topic}. Give me the smart recommendations following the 3 sections precisely.`;

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

        const recommendation = response.data?.choices?.[0]?.message?.content || JSON.stringify(response.data);

        return { suggestion: recommendation, method: "groq-llama-3" };
    } catch (err) {
        console.error("Recommendation Error:", err.response?.data || err.message);
        throw err;
    }
};
