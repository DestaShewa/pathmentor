const axios = require('axios');

async function test() {
  const url = 'http://127.0.0.1:5006/api/ai/project-evaluate';
  console.log('Testing URL:', url);
  try {
    const res = await axios.post(url, {
      title: "Test Title",
      description: "This is a test description for project evaluation."
    });
    console.log('Status:', res.status);
    console.log('Data:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.log('Error Status:', err.response?.status);
    console.log('Error Data:', err.response?.data);
    console.log('Error Message:', err.message);
  }
}

test();
