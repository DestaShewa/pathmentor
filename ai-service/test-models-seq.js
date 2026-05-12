const axios = require('axios');
require('dotenv').config();

const testModelsSeq2Seq = async () => {
    const models = [
        "google/flan-t5-large",
        "google/flan-t5-xl",
        "t5-base",
        "mistralai/Mistral-7B-Instruct-v0.3",
        "facebook/blenderbot-400M-distill",
        "microsoft/DialoGPT-medium",
        "facebook/bart-large-cnn"
    ];

    const key = process.env.HF_API_KEY;

    for (const model of models) {
        console.log(`Testing standard input on ${model}...`);
        try {
            const res = await axios.post(
                `https://router.huggingface.co/hf-inference/models/${model}`,
                { inputs: "Hello" },
                {
                    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
                    timeout: 5000
                }
            );
            console.log(`✅ SUCCESS: ${model}`);
        } catch (err) {
            console.log(`❌ FAIL: ${model} - ${err.response?.status} ${err.response?.statusText || err.message}`);
        }
    }
};

testModelsSeq2Seq();
