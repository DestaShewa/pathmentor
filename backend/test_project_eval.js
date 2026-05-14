const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:5006/api/ai';

async function testProjectEval() {
  console.log('--- AI Project Evaluation Diagnostic ---');
  console.log(`Target URL: ${AI_SERVICE_URL}/project-evaluate`);
  
  const payload = {
    title: "EcoTrack: Personalized Sustainability App",
    description: "EcoTrack is a mobile application built with React Native and Node.js. It helps users track their daily carbon footprint by logging their transportation, diet, and energy usage. The app uses a personalized recommendation engine to suggest small lifestyle changes. I implemented the backend using Express and MongoDB, focusing on high-performance data aggregation for the leaderboard feature. I faced challenges with the Google Maps API integration but solved it by optimizing the polling interval."
  };

  try {
    const start = Date.now();
    const res = await axios.post(`${AI_SERVICE_URL}/project-evaluate`, payload);
    const duration = Date.now() - start;

    if (res.data && res.data.success) {
      console.log('✅ Success! AI Response received in', duration, 'ms');
      console.log('Results:', JSON.stringify(res.data.evaluation, null, 2));
      
      const evalData = res.data.evaluation;
      const totalAIScore = (evalData.understandingScore || 0) + (Math.round(evalData.humanConfidenceScore * 0.3) || 0);
      console.log(`Calculated AI Contribution Score: ${totalAIScore}/50`);
      
      if (totalAIScore > 0) {
        console.log('✅ Scoring weights verified.');
      } else {
        console.log('❌ Scoring failure: AI results returned zero or invalid data.');
      }
    } else {
      console.log('❌ Failure: Malformed response from AI Service', res.data);
    }
  } catch (err) {
    console.error('❌ Diagnostic Error:', err.response?.data || err.message);
    if (err.message.includes('ECONNREFUSED')) {
      console.log('TIP: Ensure the ai-service is running on the correct port.');
    }
  }
}

testProjectEval();
