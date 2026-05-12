require('dotenv').config();
const quizService = require('./services/quizService');

async function test() {
    try {
        console.log("Testing Quiz Generation for topic: 'Javascript Closures'...");
        const result = await quizService.generateQuiz('Javascript Closures');
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Test Failed!");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Message:", error.message);
        }
    }
}

test();
