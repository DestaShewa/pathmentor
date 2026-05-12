const axios = require('axios');

// Helper: wait for a given number of milliseconds
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

exports.summarizeText = async (text, lengthStyle = "medium", formatStyle = "paragraph") => {
    // Dynamic logic for lengths
    let minL = 30;
    let maxL = 130;
    if (lengthStyle === "short") { minL = 10; maxL = 50; }
    if (lengthStyle === "long") { minL = 100; maxL = 300; }

    // Dynamic prompt trick for format style using strict bullets
    let inputPayload = text;
    if (formatStyle === "bullet") {
        inputPayload = "Summarize the following into bullet points: " + text;
    }

    // Retry up to 3 times in case model is loading
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const response = await axios.post(
                "https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn",
                {
                    inputs: inputPayload,
                    parameters: {
                        min_length: minL,
                        max_length: maxL
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.HF_API_KEY}`,
                        "Content-Type": "application/json",
                    },
                    timeout: 30000, // 30 second timeout
                }
            );

            // HF returns [{summary_text: "..."}] for BART
            if (Array.isArray(response.data) && response.data[0]?.summary_text) {
                let generatedText = response.data[0].summary_text;

                // If they asked for bullets, do our best to map the generated sentences into a markdown list
                if (formatStyle === "bullet") {
                    const lines = generatedText.split(/(?<=\.)\s+/);
                    generatedText = lines.map(line => `- ${line.trim()}`).join("\n");
                }

                return generatedText;
            }

            return response.data;

        } catch (err) {
            const status = err.response?.status;
            const hfError = err.response?.data?.error;
            const estimatedTime = err.response?.data?.estimated_time;

            console.error(`[Summarizer] Attempt ${attempt} failed. Status: ${status}. HF Error: ${hfError}`);

            // 503 = Model is loading. Wait and retry.
            if (status === 503 && attempt < 3) {
                const waitTime = (estimatedTime || 20) * 1000;
                console.log(`[Summarizer] Model loading. Waiting ${waitTime / 1000}s before retry...`);
                await wait(waitTime);
                continue;
            }

            // 401 = Bad API Key
            if (status === 401) {
                throw new Error("Unauthorized: Check your HF_API_KEY in the .env file.");
            }

            // 403 = Need to accept model license
            if (status === 403) {
                throw new Error("Forbidden: You must accept the model license at huggingface.co/facebook/bart-large-cnn");
            }

            // All other errors - throw with full detail
            throw new Error(`HuggingFace Error ${status}: ${hfError || err.message}`);
        }
    }

    throw new Error("Model failed to load after 3 attempts. Please try again later.");
};
