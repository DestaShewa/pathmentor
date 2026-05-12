const axios = require('axios');

exports.analyzeSimilarity = async (sourceText, targetText) => {
    try {
        const response = await axios.post(
            "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2",
            {
                inputs: {
                    source_sentence: sourceText,
                    sentences: [targetText]
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.HF_API_KEY}`,
                    "Content-Type": "application/json",
                },
                timeout: 30000,
            }
        );

        // Model returns an array of floating point match values corresponding to the target sentences array
        const scores = response.data;
        let decimalScore = 0;

        if (Array.isArray(scores) && typeof scores[0] === 'number') {
            decimalScore = scores[0];
        }

        const percentage = (decimalScore * 100).toFixed(2);

        return {
            similarity: Number(percentage),
            raw: decimalScore,
            method: "sentence-transformers/all-MiniLM-L6-v2"
        };
    } catch (err) {
        if (err.response?.data?.error?.includes("loading")) {
            return { error: "Model is currently loading.", waitTime: err.response.data.estimated_time }
        }
        console.error("Similarity Error:", err.response?.data || err.message);
        throw err;
    }
};
