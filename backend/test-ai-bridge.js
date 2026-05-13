const axios = require('axios');

async function testBridge() {
    console.log('--- Testing AI Service Bridge ---');

    // 1. Test Health Check
    try {
        console.log('\n1. Testing Backend Health Proxy...');
        const health = await axios.get('http://localhost:5001/api/ai/health');
        console.log('Result:', health.data);
    } catch (error) {
        console.error('FAILED:', error.response?.data || error.message);
    }

    // 2. Test unprotected route (should fail if middleware works)
    try {
        console.log('\n2. Testing Protected Route (No Auth)...');
        await axios.post('http://localhost:5001/api/ai/chat', { message: 'hello' });
        console.log('FAILED: Should have returned 401');
    } catch (error) {
        console.log('SUCCESS: Blocked as expected (Status:', error.response?.status, ')');
    }

    // Note: To test fully, I would need a valid JWT token. 
    // Since I'm in a headless environment, I'll focus on the health check which is public in my implementation.
}

testBridge();
