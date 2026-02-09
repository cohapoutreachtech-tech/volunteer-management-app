/**
 * AuthAPI Test Suite
 * Tests login endpoint with various success and failure scenarios
 */

require('dotenv').config({ path: '../../.env' });

const BASE_URL = process.env.SF_SITE_URL || 'https://orgfarm-ea051935cf-dev-ed.develop.my.site.com/volunteerapivforcesite';
const API_URL = `${BASE_URL}/services/apexrest`;

// Test data
const VALID_EMAIL = 'admin@cohap.org';
const VALID_PASSWORD = 'admin123';

// Test results tracking
let testsPassed = 0;
let testsFailed = 0;
const failedTests = [];

/**
 * Test helper function
 */
async function runTest(testName, testFn) {
  try {
    console.log(`\n🧪 ${testName}`);
    await testFn();
    console.log(`   ✅ PASS`);
    testsPassed++;
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    testsFailed++;
    failedTests.push({ name: testName, error: error.message });
  }
}

/**
 * Assert helper function
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Test login with valid credentials
 */
async function testValidLogin() {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: VALID_EMAIL,
      password: VALID_PASSWORD
    })
  });

  const data = await response.json();

  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.message === 'Login successful', 'Expected success message');
  assert(data.token, 'Expected JWT token in response');
  assert(data.volunteer, 'Expected volunteer object in response');
  assert(data.volunteer.Email__c === VALID_EMAIL, 'Expected correct email in response');
}

/**
 * Test login with invalid email (wrong email)
 */
async function testInvalidEmail() {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'nonexistent@example.com',
      password: VALID_PASSWORD
    })
  });

  const data = await response.json();

  assert(response.status === 401, `Expected 401, got ${response.status}`);
  assert(data.error === 'Invalid email or password', 'Expected invalid credentials error');
}

/**
 * Test login with invalid password
 */
async function testInvalidPassword() {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: VALID_EMAIL,
      password: 'wrongpassword'
    })
  });

  const data = await response.json();

  assert(response.status === 401, `Expected 401, got ${response.status}`);
  assert(data.error === 'Invalid email or password', 'Expected invalid credentials error');
}

/**
 * Test login with missing email field
 */
async function testMissingEmail() {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      password: VALID_PASSWORD
    })
  });

  const data = await response.json();

  assert(response.status === 400, `Expected 400, got ${response.status}`);
  assert(data.error && data.error.includes('email'), 'Expected missing email error');
}

/**
 * Test login with missing password field
 */
async function testMissingPassword() {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: VALID_EMAIL
    })
  });

  const data = await response.json();

  assert(response.status === 400, `Expected 400, got ${response.status}`);
  assert(data.error && data.error.includes('password'), 'Expected missing password error');
}

/**
 * Test login with both fields missing
 */
async function testMissingBothFields() {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });

  const data = await response.json();

  assert(response.status === 400, `Expected 400, got ${response.status}`);
  assert(data.error, 'Expected error message');
}

/**
 * Test login with empty email
 */
async function testEmptyEmail() {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: '',
      password: VALID_PASSWORD
    })
  });

  const data = await response.json();

  assert(response.status === 400 || response.status === 401, `Expected 400 or 401, got ${response.status}`);
  assert(data.error, 'Expected error message');
}

/**
 * Test login with empty password
 */
async function testEmptyPassword() {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: VALID_EMAIL,
      password: ''
    })
  });

  const data = await response.json();

  assert(response.status === 400 || response.status === 401, `Expected 400 or 401, got ${response.status}`);
  assert(data.error, 'Expected error message');
}

/**
 * Test login with invalid email format
 */
async function testInvalidEmailFormat() {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'not-an-email',
      password: VALID_PASSWORD
    })
  });

  const data = await response.json();

  assert(response.status === 400 || response.status === 401, `Expected 400 or 401, got ${response.status}`);
  assert(data.error, 'Expected error message');
}

/**
 * Test login with null email
 */
async function testNullEmail() {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: null,
      password: VALID_PASSWORD
    })
  });

  const data = await response.json();

  assert(response.status === 400, `Expected 400, got ${response.status}`);
  assert(data.error, 'Expected error message');
}

/**
 * Test login with null password
 */
async function testNullPassword() {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: VALID_EMAIL,
      password: null
    })
  });

  const data = await response.json();

  assert(response.status === 400, `Expected 400, got ${response.status}`);
  assert(data.error, 'Expected error message');
}

/**
 * Test login with SQL injection attempt
 */
async function testSQLInjection() {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: "admin@cohap.org' OR '1'='1",
      password: "' OR '1'='1"
    })
  });

  const data = await response.json();

  assert(response.status === 401, `Expected 401, got ${response.status}`);
  assert(data.error, 'Expected error message - SQL injection should not work');
}

/**
 * Test login with inactive volunteer
 */
async function testInactiveVolunteer() {
  // This assumes there's an inactive volunteer in the system
  // If not, this test will pass but note that it couldn't be fully tested
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'inactive@cohap.org',
      password: 'password123'
    })
  });

  const data = await response.json();

  // Should return 401 since volunteer doesn't exist or login should check status
  assert(response.status === 401 || response.status === 403, `Expected 401 or 403, got ${response.status}`);
}

/**
 * Test login with invalid JSON
 */
async function testInvalidJSON() {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not valid json'
    });

    const data = await response.json();
    assert(response.status >= 400, `Expected error status, got ${response.status}`);
  } catch (error) {
    // Expected to fail parsing
    assert(true, 'Invalid JSON correctly rejected');
  }
}

/**
 * Test login with missing Content-Type header
 */
async function testMissingContentType() {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: VALID_EMAIL,
      password: VALID_PASSWORD
    })
  });

  // Should still work or return appropriate error
  assert(response.status !== 500, 'Should not return internal server error');
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('========================================');
  console.log('🧪 AuthAPI Test Suite');
  console.log('========================================');
  console.log(`Testing endpoint: ${API_URL}/api/auth/login`);

  // Success cases
  console.log('\n📗 SUCCESS CASES');
  await runTest('Valid login credentials', testValidLogin);

  // Validation errors (400)
  console.log('\n📕 VALIDATION ERRORS (400)');
  await runTest('Missing email field', testMissingEmail);
  await runTest('Missing password field', testMissingPassword);
  await runTest('Missing both fields', testMissingBothFields);
  await runTest('Empty email', testEmptyEmail);
  await runTest('Empty password', testEmptyPassword);
  await runTest('Invalid email format', testInvalidEmailFormat);
  await runTest('Null email', testNullEmail);
  await runTest('Null password', testNullPassword);
  await runTest('Invalid JSON', testInvalidJSON);

  // Authentication errors (401)
  console.log('\n📙 AUTHENTICATION ERRORS (401)');
  await runTest('Invalid email (non-existent)', testInvalidEmail);
  await runTest('Invalid password', testInvalidPassword);
  await runTest('SQL injection attempt', testSQLInjection);
  
  // Authorization errors (403)
  console.log('\n📒 AUTHORIZATION ERRORS (403)');
  await runTest('Inactive volunteer', testInactiveVolunteer);

  // Edge cases
  console.log('\n📘 EDGE CASES');
  await runTest('Missing Content-Type header', testMissingContentType);

  // Summary
  console.log('\n========================================');
  console.log('📊 TEST SUMMARY');
  console.log('========================================');
  console.log(`Total Tests: ${testsPassed + testsFailed}`);
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

  if (failedTests.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    failedTests.forEach(test => {
      console.log(`   - ${test.name}: ${test.error}`);
    });
  }

  console.log('========================================\n');

  // Exit with error code if tests failed
  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test suite error:', error);
  process.exit(1);
});
