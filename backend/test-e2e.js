/**
 * E2E Test Script for Auth Endpoints
 * Run with: node test-e2e.js
 * 
 * This script simulates a user journey to verify the backend API.
 */

const http = require('http');

// Use built-in fetch if available (Node 18+), otherwise warn
if (!global.fetch) {
    console.error('❌ This script requires Node.js 18+ for built-in fetch support.');
    process.exit(1);
}

const API_URL = 'http://localhost:8000/api';
const TEST_USER = {
    name: 'E2E Test User',
    email: `test_${Date.now()}@example.com`,
    password: 'Password123!'
};

async function runTest() {
    console.log('🚀 Starting E2E Auth Test...\n');
    console.log(`Target API: ${API_URL}`);
    console.log(`Test User: ${TEST_USER.email}\n`);

    try {
        // 1. Health Check
        console.log('1. Checking Server Health...');
        try {
            const health = await fetch(`${API_URL}/health`).then(r => r.json());
            if (!health.success) throw new Error('Server is not healthy');
            console.log('✅ Server is running\n');
        } catch (e) {
            throw new Error(`Server unreachable at ${API_URL}. Is it running? (npm start)`);
        }

        // 2. Register
        console.log('2. Testing Registration...');
        const regRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(TEST_USER)
        });
        const regData = await regRes.json();
        
        if (!regData.success) {
            throw new Error(`Registration failed: ${regData.message}`);
        }
        console.log('✅ Registration successful');
        console.log(`   User ID: ${regData.user.id}`);
        console.log(`   Token: ${regData.token.substring(0, 15)}...\n`);

        // 3. Login
        console.log('3. Testing Login...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_USER.email, password: TEST_USER.password })
        });
        const loginData = await loginRes.json();
        
        if (!loginData.success) {
            throw new Error(`Login failed: ${loginData.message}`);
        }
        const authToken = loginData.token;
        console.log('✅ Login successful\n');

        // 4. Get Profile (Protected Route)
        console.log('4. Testing Protected Route (Get Profile)...');
        const profileRes = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const profileData = await profileRes.json();
        
        if (!profileData.success) throw new Error('Profile fetch failed');
        if (profileData.data.email !== TEST_USER.email) throw new Error('Profile email mismatch');
        console.log('✅ Profile fetched successfully\n');

        // 5. Forgot Password
        console.log('5. Testing Forgot Password...');
        const forgotRes = await fetch(`${API_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_USER.email })
        });
        const forgotData = await forgotRes.json();
        console.log(`✅ Forgot Password Response: "${forgotData.message}"\n`);

        console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
    }
}

runTest();