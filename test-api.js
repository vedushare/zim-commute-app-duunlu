
/**
 * Simple API Test Script
 * 
 * Run this with: node test-api.js
 * 
 * This script tests the backend API endpoints to ensure they're working correctly.
 */

const BACKEND_URL = 'https://q3k4fsea3tg38xxu8kgvz4h2nvu6gtwh.app.specular.dev';

async function testAPI() {
  console.log('🧪 Testing ZimCommute Backend API\n');
  console.log('Backend URL:', BACKEND_URL);
  console.log('─'.repeat(50));

  // Test 1: Send OTP
  console.log('\n📱 Test 1: Send OTP');
  try {
    const response = await fetch(`${BACKEND_URL}/api/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: '+263771234567' }),
    });
    
    const data = await response.json();
    console.log('✅ Status:', response.status);
    console.log('✅ Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ OTP sent successfully!');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 2: Verify OTP (will fail without real OTP)
  console.log('\n🔐 Test 2: Verify OTP (testing endpoint)');
  try {
    const response = await fetch(`${BACKEND_URL}/api/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        phoneNumber: '+263771234567',
        otp: '123456' // Test OTP
      }),
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.status === 400 || response.status === 401) {
      console.log('✅ Endpoint is working (expected to fail with test OTP)');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 3: Get User (will fail without auth)
  console.log('\n👤 Test 3: Get Current User (testing auth requirement)');
  try {
    const response = await fetch(`${BACKEND_URL}/api/users/me`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.status === 401) {
      console.log('✅ Endpoint is protected (expected 401 without auth)');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n' + '─'.repeat(50));
  console.log('✅ API tests complete!\n');
  console.log('Next steps:');
  console.log('1. Check backend logs for the OTP code');
  console.log('2. Use that OTP in the app to test full flow');
  console.log('3. Test on iOS, Android, and Web');
}

testAPI().catch(console.error);
