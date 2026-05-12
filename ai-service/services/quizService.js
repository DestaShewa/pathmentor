const axios = require('axios');

exports.generateQuiz = async (topic) => {
    const systemPrompt = `You are an expert educator. Generate one clear multiple-choice question about the topic provided. 
    Format your response exactly as follows:
    Question: [The Question]
    A) [Option]
    B) [Option]
    C) [Option]
    D) [Option]
    Correct Answer: [Letter]`;

    try {
        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Generate a quiz about: ${topic}` }
                ],
                temperature: 0.7,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json",
                }
            }
        );

        const content = response.data?.choices?.[0]?.message?.content;
        return { content: content, method: "Groq Llama-3 (High Speed)" };
    } catch (err) {
        console.error("Groq Quiz Error:", err.message);
        throw err;
    }
};
