const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const AI_SERVICE_URL = 'http://127.0.0.1:5006/api/ai';

async function proveRealWork() {
  console.log('--- PathMentor AI Service: Real-World Proof Diagnostic ---');
  console.log(`[STATUS] Connecting to AI Microservice at ${AI_SERVICE_URL}...`);
  
  const testCases = [
    {
      type: "Human-Written (High Detail)",
      title: "TaskMaster Pro: Unified Productivity Dashboard",
      description: "TaskMaster Pro is a full-stack task management application. I built it because I struggle with organizing multi-phase projects. I used React for the frontend and Node.js with PostgreSQL for the backend. One of the biggest challenges was implementing the drag-and-drop feature for tasks using react-beautiful-dnd, which required complex state management to ensure sync with the database. I eventually solved it by optimistic updates."
    },
    {
      type: "AI-Generated (Robotic Tone)",
      title: "Advanced Task Management System",
      description: "Furthermore, the Advanced Task Management System is a comprehensive solution for productivity. In conclusion, it leverages a robust architecture to facilitate efficient task tracking and management. Additionally, the system provides a user-friendly interface that enhances overall operational efficiency and streamlines workflows for institutional excellence."
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n[TESTING] Evaluating ${testCase.type}...`);
    try {
      const res = await axios.post(`${AI_SERVICE_URL}/project-evaluate`, testCase);
      const evalData = res.data.evaluation;
      
      console.log(`[RESULT] Understanding Score: ${evalData.understandingScore}/20`);
      console.log(`[RESULT] AI Probability: ${evalData.aiProbability}%`);
      console.log(`[FEEDBACK] ${evalData.authenticityFeedback}`);
      console.log(`[REC] ${evalData.recommendations[0] || 'N/A'}`);
    } catch (err) {
      console.error(`[ERROR] AI Request failed: ${err.message}`);
    }
  }
}

proveRealWork();
