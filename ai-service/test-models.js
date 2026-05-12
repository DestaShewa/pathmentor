const axios = require('axios');
require('dotenv').config();

const testModels = async () => {
    const models = [
        "Qwen/Qwen2.5-Coder-32B-Instruct",
        "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
        "google/gemma-7b-it",
        "meta-llama/Llama-3.2-1B-Instruct"
    ];

    const key = process.env.HF_API_KEY;

    for (const model of models) {
        console.log(`Testing ${model}...`);
        try {
            const res = await axios.post(
                "https://router.huggingface.co/hf-inference/v1/chat/completions",
                {
                    model: model,
                    messages: [{ role: "user", content: "hi" }]
                },
                {
                    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
                    timeout: 5000
                }
            );
            console.log(`✅ SUCCESS: ${model}`);
        } catch (err) {
            console.log(`❌ FAIL: ${model} - ${err.response?.status} ${err.response?.statusText}`);
        }
    }
};

testModels();
