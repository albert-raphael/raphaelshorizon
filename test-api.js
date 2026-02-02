#!/usr/bin/env node

/**
 * API Test Script for Raphael's Horizon
 * Tests all critical endpoints to ensure the application is working
 */

const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:8000';
const API_BASE = `${BASE_URL}/api`;

console.log('🧪 Testing Raphael\'s Horizon API...\n');

// Test results
const results = {
    passed: 0,
    failed: 0,
    tests: []
};

function logResult(testName, success, message = '') {
    const status = success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${testName}`);
    if (message) console.log(`   ${message}`);

    results.tests.push({ name: testName, success, message });
    if (success) results.passed++;
    else results.failed++;
}

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const req = protocol.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ status: res.statusCode, data: jsonData });
                } catch (e) {
                    resolve({ status: res.statusCode, data });
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (options.method === 'POST' && options.body) {
            req.write(JSON.stringify(options.body));
        }

        req.end();
    });
}

async function runTests() {
    try {
        // Test 1: Health Check
        console.log('1. Testing Health Check...');
        try {
            const health = await makeRequest(`${API_BASE}/health`);
            if (health.status === 200 && health.data.success) {
                logResult('Health Check', true, `Mode: ${health.data.mode || 'unknown'}`);
            } else {
                logResult('Health Check', false, `Status: ${health.status}`);
            }
        } catch (error) {
            logResult('Health Check', false, error.message);
        }

        // Test 2: Home Route
        console.log('2. Testing Home Route...');
        try {
            const home = await makeRequest(BASE_URL);
            if (home.status === 200) {
                logResult('Home Route', true);
            } else {
                logResult('Home Route', false, `Status: ${home.status}`);
            }
        } catch (error) {
            logResult('Home Route', false, error.message);
        }

        // Test 3: Books List (Public)
        console.log('3. Testing Books API...');
        try {
            const books = await makeRequest(`${API_BASE}/books`);
            if (books.status === 200 && books.data.success) {
                logResult('Books List', true, `Found ${books.data.data?.length || 0} books`);
            } else {
                logResult('Books List', false, `Status: ${books.status}`);
            }
        } catch (error) {
            logResult('Books List', false, error.message);
        }

        // Test 4: Blog Posts
        console.log('4. Testing Blog API...');
        try {
            const posts = await makeRequest(`${API_BASE}/blog/posts`);
            if (posts.status === 200 && posts.data.success) {
                logResult('Blog Posts', true, `Found ${posts.data.data?.length || 0} posts`);
            } else {
                logResult('Blog Posts', false, `Status: ${posts.status}`);
            }
        } catch (error) {
            logResult('Blog Posts', false, error.message);
        }

        // Test 5: Admin Stats (should fail without auth)
        console.log('5. Testing Admin Protection...');
        try {
            const admin = await makeRequest(`${API_BASE}/admin/stats`);
            if (admin.status === 401 || admin.status === 403) {
                logResult('Admin Protection', true, 'Correctly protected');
            } else {
                logResult('Admin Protection', false, `Unexpected status: ${admin.status}`);
            }
        } catch (error) {
            logResult('Admin Protection', true, 'Request failed as expected');
        }

        // Test 6: Invalid Route
        console.log('6. Testing 404 Handling...');
        try {
            const notFound = await makeRequest(`${API_BASE}/nonexistent`);
            if (notFound.status === 404) {
                logResult('404 Handling', true);
            } else {
                logResult('404 Handling', false, `Status: ${notFound.status}`);
            }
        } catch (error) {
            logResult('404 Handling', false, error.message);
        }

    } catch (error) {
        console.error('Test runner error:', error);
    }

    // Print summary
    console.log('\n📊 Test Results Summary:');
    console.log(`Total Tests: ${results.tests.length}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);

    if (results.failed === 0) {
        console.log('\n🎉 All tests passed! The application is ready.');
        process.exit(0);
    } else {
        console.log('\n⚠️  Some tests failed. Check the issues above.');
        process.exit(1);
    }
}

// Check if server is running
console.log('Checking if server is running...');
makeRequest(`${API_BASE}/health`)
    .then(() => {
        console.log('✅ Server is running\n');
        runTests();
    })
    .catch(() => {
        console.log('❌ Server is not running on localhost:8000');
        console.log('Please start the server first:');
        console.log('  cd backend && npm start');
        process.exit(1);
    });