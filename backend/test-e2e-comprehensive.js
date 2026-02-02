/**
 * Comprehensive E2E Test Script for Raphael's Horizon
 * Tests all auth flows, admin functionality, and API endpoints
 */

const http = require('http');

const BASE_URL = 'http://localhost';
let adminToken = null;
let userToken = null;
const testResults = [];

// Helper function to make HTTP requests
function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Test result logger
function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}${details ? ' - ' + details : ''}`);
  testResults.push({ name, passed, details });
}

// =========================
// TEST SUITES
// =========================

async function testHealthEndpoint() {
  console.log('\n📋 Testing Health Endpoint...');
  try {
    const res = await request('GET', '/api/health');
    logTest('GET /api/health', res.status === 200 && res.data.success === true, 
      `Status: ${res.status}, Mode: ${res.data.mode}`);
  } catch (e) {
    logTest('GET /api/health', false, e.message);
  }
}

async function testAdminLogin() {
  console.log('\n📋 Testing Admin Login...');
  
  // Test invalid credentials
  try {
    const res = await request('POST', '/api/auth/admin-login', {
      email: 'admin@raphaelshorizon.com',
      password: 'wrongpassword'
    });
    logTest('Admin login with wrong password rejected', res.status === 400, 
      `Status: ${res.status}`);
  } catch (e) {
    logTest('Admin login with wrong password rejected', false, e.message);
  }

  // Test valid admin credentials
  try {
    const res = await request('POST', '/api/auth/admin-login', {
      email: 'admin@raphaelshorizon.com',
      password: 'mT4xC66LcU#xc&e$'
    });
    const passed = res.status === 200 && res.data.success && res.data.token;
    if (passed) {
      adminToken = res.data.token;
    }
    logTest('Admin login with correct credentials', passed, 
      `Status: ${res.status}, Has Token: ${!!res.data.token}, Role: ${res.data.user?.role}`);
  } catch (e) {
    logTest('Admin login with correct credentials', false, e.message);
  }

  // Test regular login blocked for admin
  try {
    const res = await request('POST', '/api/auth/login', {
      email: 'admin@raphaelshorizon.com',
      password: 'mT4xC66LcU#xc&e$'
    });
    logTest('Admin blocked from regular login', res.status === 403, 
      `Status: ${res.status}, Message: ${res.data.message}`);
  } catch (e) {
    logTest('Admin blocked from regular login', false, e.message);
  }
}

async function testAuthMe() {
  console.log('\n📋 Testing Auth Me Endpoint...');
  
  // Without token
  try {
    const res = await request('GET', '/api/auth/me');
    logTest('GET /api/auth/me without token rejected', res.status === 401, 
      `Status: ${res.status}`);
  } catch (e) {
    logTest('GET /api/auth/me without token rejected', false, e.message);
  }

  // With admin token
  if (adminToken) {
    try {
      const res = await request('GET', '/api/auth/me', null, adminToken);
      logTest('GET /api/auth/me with admin token', res.status === 200 && res.data.success, 
        `Status: ${res.status}, User: ${res.data.data?.email}`);
    } catch (e) {
      logTest('GET /api/auth/me with admin token', false, e.message);
    }
  }
}

async function testAdminStatsEndpoint() {
  console.log('\n📋 Testing Admin Stats Endpoint...');
  
  // Without token
  try {
    const res = await request('GET', '/api/admin/stats');
    logTest('GET /api/admin/stats without token rejected', res.status === 401, 
      `Status: ${res.status}`);
  } catch (e) {
    logTest('GET /api/admin/stats without token rejected', false, e.message);
  }

  // With admin token
  if (adminToken) {
    try {
      const res = await request('GET', '/api/admin/stats', null, adminToken);
      const passed = res.status === 200 && res.data.success && res.data.data;
      logTest('GET /api/admin/stats with admin token', passed, 
        `Status: ${res.status}, Users: ${res.data.data?.totalUsers}, Books: ${res.data.data?.totalBooks}`);
    } catch (e) {
      logTest('GET /api/admin/stats with admin token', false, e.message);
    }
  }
}

async function testAdminUsersEndpoint() {
  console.log('\n📋 Testing Admin Users Endpoint...');
  
  if (adminToken) {
    try {
      const res = await request('GET', '/api/admin/users', null, adminToken);
      const passed = res.status === 200 && res.data.success && Array.isArray(res.data.data);
      logTest('GET /api/admin/users', passed, 
        `Status: ${res.status}, User Count: ${res.data.data?.length}`);
    } catch (e) {
      logTest('GET /api/admin/users', false, e.message);
    }
  }
}

async function testAdminBooksEndpoint() {
  console.log('\n📋 Testing Admin Books Endpoint...');
  
  if (adminToken) {
    try {
      const res = await request('GET', '/api/admin/books', null, adminToken);
      const passed = res.status === 200 && res.data.success;
      logTest('GET /api/admin/books', passed, 
        `Status: ${res.status}, Books: ${res.data.data?.length || 0}`);
    } catch (e) {
      logTest('GET /api/admin/books', false, e.message);
    }
  }
}

async function testAdminPostsEndpoint() {
  console.log('\n📋 Testing Admin Posts Endpoint...');
  
  if (adminToken) {
    try {
      const res = await request('GET', '/api/admin/posts', null, adminToken);
      const passed = res.status === 200 && res.data.success;
      logTest('GET /api/admin/posts', passed, 
        `Status: ${res.status}, Posts: ${res.data.data?.length || 0}`);
    } catch (e) {
      logTest('GET /api/admin/posts', false, e.message);
    }
  }
}

async function testAdminSettingsEndpoint() {
  console.log('\n📋 Testing Admin Settings Endpoint...');
  
  if (adminToken) {
    try {
      const res = await request('GET', '/api/admin/settings', null, adminToken);
      const passed = res.status === 200 && res.data.success;
      logTest('GET /api/admin/settings', passed, 
        `Status: ${res.status}`);
    } catch (e) {
      logTest('GET /api/admin/settings', false, e.message);
    }
  }
}

async function testUserRegistration() {
  console.log('\n📋 Testing User Registration...');
  
  const testEmail = `test_${Date.now()}@example.com`;
  
  try {
    const res = await request('POST', '/api/auth/register', {
      name: 'Test User',
      email: testEmail,
      password: 'TestPass123!'
    });
    const passed = res.status === 200 && res.data.success && res.data.token;
    if (passed) {
      userToken = res.data.token;
    }
    logTest('User registration', passed, 
      `Status: ${res.status}, Email: ${testEmail}`);
  } catch (e) {
    logTest('User registration', false, e.message);
  }
}

async function testUserLogin() {
  console.log('\n📋 Testing User Login...');
  
  // If we registered a user, test login
  if (userToken) {
    try {
      const res = await request('GET', '/api/auth/me', null, userToken);
      logTest('GET /api/auth/me with user token', res.status === 200 && res.data.success, 
        `Status: ${res.status}`);
    } catch (e) {
      logTest('GET /api/auth/me with user token', false, e.message);
    }
  }
}

async function testSubscriptionEndpoints() {
  console.log('\n📋 Testing Subscription Endpoints...');
  
  try {
    const res = await request('GET', '/api/payments/config');
    logTest('GET /api/payments/config', res.status === 200 && res.data.success, 
      `Status: ${res.status}, PayPal Enabled: ${res.data.providers?.paypal?.enabled}`);
  } catch (e) {
    logTest('GET /api/payments/config', false, e.message);
  }
}

async function testStaticPages() {
  console.log('\n📋 Testing Static Page Access...');
  
  const pages = [
    { path: '/homepage.html', name: 'Homepage' },
    { path: '/pages/admin/login_admin.html', name: 'Admin Login Page' },
    { path: '/pages/profile/login.html', name: 'User Login Page' },
    { path: '/pages/admin/admin-dashboard.html', name: 'Admin Dashboard' },
    { path: '/js/auth-guard.js', name: 'Auth Guard JS' },
    { path: '/js/auth.js', name: 'Auth JS' },
    { path: '/css/styles.css', name: 'Main CSS' },
  ];

  for (const page of pages) {
    try {
      const res = await request('GET', page.path);
      const passed = res.status === 200;
      logTest(`Static: ${page.name}`, passed, `Status: ${res.status}`);
    } catch (e) {
      logTest(`Static: ${page.name}`, false, e.message);
    }
  }
}

// =========================
// MAIN TEST RUNNER
// =========================

async function runAllTests() {
  console.log('='.repeat(60));
  console.log('🚀 COMPREHENSIVE E2E TEST SUITE');
  console.log('='.repeat(60));
  console.log(`Started: ${new Date().toISOString()}`);
  console.log(`Target: ${BASE_URL}`);
  
  await testHealthEndpoint();
  await testStaticPages();
  await testAdminLogin();
  await testAuthMe();
  await testAdminStatsEndpoint();
  await testAdminUsersEndpoint();
  await testAdminBooksEndpoint();
  await testAdminPostsEndpoint();
  await testAdminSettingsEndpoint();
  await testUserRegistration();
  await testUserLogin();
  await testSubscriptionEndpoints();
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passed = testResults.filter(t => t.passed).length;
  const failed = testResults.filter(t => !t.passed).length;
  const total = testResults.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.filter(t => !t.passed).forEach(t => {
      console.log(`  - ${t.name}: ${t.details}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  process.exit(failed > 0 ? 1 : 0);
}

runAllTests().catch(console.error);
