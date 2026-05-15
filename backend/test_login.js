const axios = require('axios');

async function test() {
  try {
    // Register
    console.log("Registering mentor...");
    const regRes = await axios.post('http://localhost:5001/api/auth/register', {
      name: "Test Mentor 2",
      email: "testmentor2@test.com",
      password: "Password123!",
      role: "mentor"
    });
    console.log("Register output:", regRes.data.user);

    // Login
    console.log("Logging in...");
    const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
      email: "testmentor2@test.com",
      password: "Password123!"
    });
    console.log("Login output:", loginRes.data.user);

    // Get Profile
    console.log("Getting profile...");
    const profileRes = await axios.get('http://localhost:5001/api/users/profile', {
      headers: {
        Authorization: `Bearer ${loginRes.data.token}`
      }
    });
    console.log("Profile output role:", profileRes.data.user.role);
    console.log("Profile output verification:", profileRes.data.user.mentorVerification);
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}

test();
