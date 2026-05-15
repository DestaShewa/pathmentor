const quizService = require('./services/quizService');
require('dotenv').config();

async function test() {
    console.log("--- Testing Quiz Generation V2 ---");
    const topic = "React Hooks and State Management";
    try {
        console.log("Generating 5 questions (beginner)...");
        const res5 = await quizService.generateQuiz(topic, 5, "beginner");
        console.log("Result (Questions Count):", res5.result.length);
        console.log("First Question:", JSON.stringify(res5.result[0], null, 2));
        console.log("AI Method:", res5.method);

        console.log("\nGenerating 10 questions (advanced)...");
        const res10 = await quizService.generateQuiz(topic, 10, "advanced");
        console.log("Result (Questions Count):", res10.result.length);
        console.log("First Question:", JSON.stringify(res10.result[0], null, 2));
        console.log("AI Method:", res10.method);
    } catch (err) {
        console.error("Test failed:", err.message);
    }
}

test();
