const axios = require('axios');

exports.generateResponse = async (historyArray) => {
    // Construct the payload by keeping our system prompt at the top, followed by the user history
    const payloadMessages = [
        {
            role: "system",
            content: "You are a helpful programming mentor. Explain simply and clearly. If code is given, debug and fix it. Format responses nicely using Markdown."
        },
        ...historyArray
    ];

    const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
            model: "llama-3.3-70b-versatile",
            messages: payloadMessages,
            // The parameters you requested (mapped to Groq's API):
            max_tokens: 300,
            temperature: 0.7,
            top_p: 0.9,
            frequency_penalty: 0.1 // Groq's equivalent of repetition_penalty
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json",
            },
            timeout: 30000,
        }
    );

    return response.data?.choices?.[0]?.message?.content || response.data;
};
