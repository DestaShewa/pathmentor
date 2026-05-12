require('dotenv').config();
const summarizerService = require('./services/summarizerService');

async function test() {
    try {
        console.log("Testing Summarizer...");
        const result = await summarizerService.summarizeText("The quick brown fox jumps over the lazy dog. This is a very interesting sentence about a fox and a dog.");
        console.log("Result:", result);
    } catch (error) {
        console.error("Test Failed!", error.message);
    }
}

test();
