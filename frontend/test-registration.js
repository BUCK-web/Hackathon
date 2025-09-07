const axios = require('axios');

// Simulate the exact frontend registration request
const testRegistration = async () => {
  try {
    const userData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'testfrontend@example.com',
      password: 'TestPass123',
      role: 'buyer'
    };

    console.log('Registration data being sent:', JSON.stringify(userData, null, 2));

    const response = await axios.post('http://192.168.1.51:5000/api/auth/register', userData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('Registration response received:', JSON.stringify(response.data, null, 2));
    console.log('SUCCESS: Registration completed successfully');
    
  } catch (error) {
    console.log('Registration error:', error.message);
    if (error.response) {
      console.log('Error status:', error.response.status);
      console.log('Error data:', JSON.stringify(error.response.data, null, 2));
    }
  }
};

testRegistration();