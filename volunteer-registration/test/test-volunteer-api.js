/**
 * VolunteerAPI Test Suite
 * Tests CRUD operations with various success and failure scenarios
 */

require('dotenv').config({ path: '../../.env' });

const BASE_URL = process.env.SF_SITE_URL || 'https://orgfarm-ea051935cf-dev-ed.develop.my.site.com/volunteerapivforcesite';
const API_URL = `${BASE_URL}/services/apexrest`;

// Get auth token first
const VALID_EMAIL = 'admin@cohap.org';
const VALID_PASSWORD = 'admin123';
let authToken = '';
let testVolunteerId = '';

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
 * Get authentication token
 */
async function authenticate() {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: VALID_EMAIL, password: VALID_PASSWORD })
  });

  const data = await response.json();
  authToken = data.token;
  assert(authToken, 'Failed to get auth token');
}

/**
 * Test: Create volunteer with all valid fields
 */
async function testCreateValidVolunteer() {
  const volunteer = {
    First_Name__c: 'Test',
    Last_Name__c: 'Volunteer',
    Email__c: `test${Date.now()}@example.com`,
    Phone__c: '555-1234',
    Date_of_Birth__c: '1990-01-15',
    Address__c: '123 Main St',
    City__c: 'Anytown',
    State__c: 'CA',
    Zip_Code__c: '12345',
    Emergency_Contact_Name__c: 'John Doe',
    Emergency_Contact_Phone__c: '555-5678',
    Skills__c: 'First Aid, CPR',
    Availability__c: 'Weekends'
  };

  const response = await fetch(`${API_URL}/api/volunteers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(volunteer)
  });

  const data = await response.json();

  assert(response.status === 201, `Expected 201, got ${response.status}`);
  assert(data.Id, 'Expected volunteer ID in response');
  testVolunteerId = data.Id; // Save for later tests
}

/**
 * Test: Create volunteer with missing required field (First_Name__c)
 */
async function testCreateMissingFirstName() {
  const volunteer = {
    Last_Name__c: 'Volunteer',
    Email__c: `test${Date.now()}@example.com`,
    Phone__c: '555-1234'
  };

  const response = await fetch(`${API_URL}/api/volunteers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(volunteer)
  });

  const data = await response.json();

  assert(response.status === 400, `Expected 400, got ${response.status}`);
  assert(data.error, 'Expected error message');
}

/**
 * Test: Create volunteer with missing email
 */
async function testCreateMissingEmail() {
  const volunteer = {
    First_Name__c: 'Test',
    Last_Name__c: 'Volunteer',
    Phone__c: '555-1234'
  };

  const response = await fetch(`${API_URL}/api/volunteers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(volunteer)
  });

  const data = await response.json();

  assert(response.status === 400, `Expected 400, got ${response.status}`);
  assert(data.error, 'Expected error message');
}

/**
 * Test: Create volunteer with invalid email format
 */
async function testCreateInvalidEmail() {
  const volunteer = {
    First_Name__c: 'Test',
    Last_Name__c: 'Volunteer',
    Email__c: 'not-an-email',
    Phone__c: '555-1234'
  };

  const response = await fetch(`${API_URL}/api/volunteers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(volunteer)
  });

  const data = await response.json();

  assert(response.status === 400, `Expected 400, got ${response.status}`);
  assert(data.error && data.error.includes('email'), 'Expected email validation error');
}

/**
 * Test: Create volunteer with duplicate email
 */
async function testCreateDuplicateEmail() {
  const volunteer = {
    First_Name__c: 'Test',
    Last_Name__c: 'Volunteer',
    Email__c: VALID_EMAIL, // Use existing admin email
    Phone__c: '555-1234'
  };

  const response = await fetch(`${API_URL}/api/volunteers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(volunteer)
  });

  const data = await response.json();

  assert(response.status === 409, `Expected 409, got ${response.status}`);
  assert(data.error && data.error.includes('duplicate'), 'Expected duplicate email error');
}

/**
 * Test: Create volunteer with invalid date format
 */
async function testCreateInvalidDateFormat() {
  const volunteer = {
    First_Name__c: 'Test',
    Last_Name__c: 'Volunteer',
    Email__c: `test${Date.now()}@example.com`,
    Phone__c: '555-1234',
    Date_of_Birth__c: '01/15/1990' // Wrong format, should be YYYY-MM-DD
  };

  const response = await fetch(`${API_URL}/api/volunteers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(volunteer)
  });

  const data = await response.json();

  assert(response.status === 400, `Expected 400, got ${response.status}`);
  assert(data.error && data.error.includes('date'), 'Expected date format error');
}

/**
 * Test: Create volunteer with invalid phone format
 */
async function testCreateInvalidPhone() {
  const volunteer = {
    First_Name__c: 'Test',
    Last_Name__c: 'Volunteer',
    Email__c: `test${Date.now()}@example.com`,
    Phone__c: 'not-a-phone'
  };

  const response = await fetch(`${API_URL}/api/volunteers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(volunteer)
  });

  const data = await response.json();

  assert(response.status === 400, `Expected 400, got ${response.status}`);
  assert(data.error, 'Expected phone validation error');
}

/**
 * Test: Get volunteer by valid ID
 */
async function testGetValidVolunteer() {
  assert(testVolunteerId, 'No test volunteer ID available');

  const response = await fetch(`${API_URL}/api/volunteers/${testVolunteerId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });

  const data = await response.json();

  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.Id === testVolunteerId, 'Expected correct volunteer ID');
}

/**
 * Test: Get volunteer by non-existent ID
 */
async function testGetNonExistentVolunteer() {
  const fakeId = 'a2T000000000000AAA';

  const response = await fetch(`${API_URL}/api/volunteers/${fakeId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });

  const data = await response.json();

  assert(response.status === 404, `Expected 404, got ${response.status}`);
  assert(data.error, 'Expected not found error');
}

/**
 * Test: Get volunteer with invalid ID format
 */
async function testGetInvalidIdFormat() {
  const invalidId = 'not-a-valid-id';

  const response = await fetch(`${API_URL}/api/volunteers/${invalidId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });

  const data = await response.json();

  assert(response.status === 400 || response.status === 404, `Expected 400 or 404, got ${response.status}`);
  assert(data.error, 'Expected error message');
}

/**
 * Test: Get all volunteers
 */
async function testGetAllVolunteers() {
  const response = await fetch(`${API_URL}/api/volunteers`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });

  const data = await response.json();

  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(Array.isArray(data), 'Expected array of volunteers');
}

/**
 * Test: Update volunteer with valid data
 */
async function testUpdateValidVolunteer() {
  assert(testVolunteerId, 'No test volunteer ID available');

  const updates = {
    Phone__c: '555-9999',
    Skills__c: 'Updated Skills'
  };

  const response = await fetch(`${API_URL}/api/volunteers/${testVolunteerId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(updates)
  });

  const data = await response.json();

  assert(response.status === 200, `Expected 200, got ${response.status}`);
}

/**
 * Test: Update volunteer with non-existent ID
 */
async function testUpdateNonExistentVolunteer() {
  const fakeId = 'a2T000000000000AAA';
  const updates = { Phone__c: '555-9999' };

  const response = await fetch(`${API_URL}/api/volunteers/${fakeId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(updates)
  });

  const data = await response.json();

  assert(response.status === 404, `Expected 404, got ${response.status}`);
  assert(data.error, 'Expected not found error');
}

/**
 * Test: Update volunteer with invalid date format
 */
async function testUpdateInvalidDate() {
  assert(testVolunteerId, 'No test volunteer ID available');

  const updates = {
    Date_of_Birth__c: '12/25/1990' // Wrong format
  };

  const response = await fetch(`${API_URL}/api/volunteers/${testVolunteerId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(updates)
  });

  const data = await response.json();

  assert(response.status === 400, `Expected 400, got ${response.status}`);
  assert(data.error && data.error.includes('date'), 'Expected date format error');
}

/**
 * Test: Request without authorization header
 */
async function testNoAuthHeader() {
  const response = await fetch(`${API_URL}/api/volunteers`, {
    method: 'GET'
  });

  const data = await response.json();

  assert(response.status === 401, `Expected 401, got ${response.status}`);
  assert(data.error, 'Expected unauthorized error');
}

/**
 * Test: Request with invalid token
 */
async function testInvalidToken() {
  const response = await fetch(`${API_URL}/api/volunteers`, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer invalid-token-here'
    }
  });

  const data = await response.json();

  assert(response.status === 401, `Expected 401, got ${response.status}`);
  assert(data.error, 'Expected unauthorized error');
}

/**
 * Test: Create volunteer with extra unknown fields
 */
async function testCreateWithExtraFields() {
  const volunteer = {
    First_Name__c: 'Test',
    Last_Name__c: 'Volunteer',
    Email__c: `test${Date.now()}@example.com`,
    Phone__c: '555-1234',
    Unknown_Field__c: 'This should be ignored',
    Another_Unknown: 'Also ignored'
  };

  const response = await fetch(`${API_URL}/api/volunteers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(volunteer)
  });

  // Should succeed, ignoring unknown fields
  assert(response.status === 201, `Expected 201, got ${response.status}`);
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('========================================');
  console.log('🧪 VolunteerAPI Test Suite');
  console.log('========================================');
  console.log(`Testing endpoint: ${API_URL}/api/volunteers`);

  // Authenticate first
  console.log('\n🔐 Authenticating...');
  await authenticate();
  console.log('✅ Authentication successful');

  // Success cases
  console.log('\n📗 SUCCESS CASES');
  await runTest('Create volunteer with valid data', testCreateValidVolunteer);
  await runTest('Get volunteer by valid ID', testGetValidVolunteer);
  await runTest('Get all volunteers', testGetAllVolunteers);
  await runTest('Update volunteer with valid data', testUpdateValidVolunteer);
  await runTest('Create volunteer with extra fields (ignored)', testCreateWithExtraFields);

  // Validation errors (400)
  console.log('\n📕 VALIDATION ERRORS (400)');
  await runTest('Create with missing First_Name__c', testCreateMissingFirstName);
  await runTest('Create with missing Email__c', testCreateMissingEmail);
  await runTest('Create with invalid email format', testCreateInvalidEmail);
  await runTest('Create with invalid date format', testCreateInvalidDateFormat);
  await runTest('Create with invalid phone format', testCreateInvalidPhone);
  await runTest('Update with invalid date format', testUpdateInvalidDate);
  await runTest('Get with invalid ID format', testGetInvalidIdFormat);

  // Authentication errors (401)
  console.log('\n📙 AUTHENTICATION ERRORS (401)');
  await runTest('Request without auth header', testNoAuthHeader);
  await runTest('Request with invalid token', testInvalidToken);

  // Not found errors (404)
  console.log('\n📘 NOT FOUND ERRORS (404)');
  await runTest('Get non-existent volunteer', testGetNonExistentVolunteer);
  await runTest('Update non-existent volunteer', testUpdateNonExistentVolunteer);

  // Conflict errors (409)
  console.log('\n📙 CONFLICT ERRORS (409)');
  await runTest('Create with duplicate email', testCreateDuplicateEmail);

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

  // Clean up test volunteer
  if (testVolunteerId) {
    console.log('🧹 Cleaning up test data...');
    try {
      await fetch(`${API_URL}/api/volunteers/${testVolunteerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      console.log('✅ Test volunteer deleted');
    } catch (error) {
      console.log('⚠️  Could not delete test volunteer');
    }
  }

  // Exit with error code if tests failed
  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test suite error:', error);
  process.exit(1);
});
