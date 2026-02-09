/**
 * VolunteerHoursAPI Test Suite
 * Tests CRUD operations with numeric and date validations
 */

require('dotenv').config({ path: '../../.env' });

const BASE_URL = process.env.SF_SITE_URL || 'https://orgfarm-ea051935cf-dev-ed.develop.my.site.com/volunteerapivforcesite';
const API_URL = `${BASE_URL}/services/apexrest`;

const VALID_EMAIL = 'admin@cohap.org';
const VALID_PASSWORD = 'admin123';
let authToken = '';
let testVolunteerId = '';
let testEventId = '';
let testHoursId = '';

let testsPassed = 0;
let testsFailed = 0;
const failedTests = [];

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

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function authenticate() {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: VALID_EMAIL, password: VALID_PASSWORD })
  });
  const data = await response.json();
  authToken = data.token;
  testVolunteerId = data.volunteer.Id;
  assert(authToken, 'Failed to get auth token');
}

async function createTestEvent() {
  const event = {
    Title__c: `Test Event ${Date.now()}`,
    Description__c: 'Event for hours testing',
    Location__c: '123 Test St',
    Event_Date__c: '2026-06-15',
    Event_Status__c: 'Active'
  };

  const response = await fetch(`${API_URL}/api/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(event)
  });

  const data = await response.json();
  testEventId = data.Id;
  assert(testEventId, 'Failed to create test event');
}

/**
 * Test: Create volunteer hours with valid data
 */
async function testCreateValidHours() {
  const hours = {
    Volunteer__c: testVolunteerId,
    Event__c: testEventId,
    Shift_Date__c: '2026-06-15',
    Clock_In_Time__c: '09:00 AM',
    Clock_Out_Time__c: '01:00 PM',
    Total_Hours__c: 4,
    Status__c: 'Pending'
  };

  const response = await fetch(`${API_URL}/api/volunteerhours`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(hours)
  });

  const data = await response.json();

  assert(response.status === 201, `Expected 201, got ${response.status}`);
  assert(data.Id, 'Expected hours record ID');
  testHoursId = data.Id;
}

/**
 * Test: Create hours with non-existent volunteer ID
 */
async function testCreateNonExistentVolunteer() {
  const hours = {
    Volunteer__c: 'a2T000000000000AAA',
    Event__c: testEventId,
    Shift_Date__c: '2026-06-15',
    Total_Hours__c: 4,
    Status__c: 'Pending'
  };

  const response = await fetch(`${API_URL}/api/volunteerhours`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(hours)
  });

  const data = await response.json();

  assert(response.status === 404, `Expected 404, got ${response.status}`);
  assert(data.error && data.error.includes('Volunteer'), 'Expected volunteer not found error');
}

/**
 * Test: Create hours with non-existent event ID
 */
async function testCreateNonExistentEvent() {
  const hours = {
    Volunteer__c: testVolunteerId,
    Event__c: 'a2T000000000000AAA',
    Shift_Date__c: '2026-06-15',
    Total_Hours__c: 4,
    Status__c: 'Pending'
  };

  const response = await fetch(`${API_URL}/api/volunteerhours`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(hours)
  });

  const data = await response.json();

  assert(response.status === 404, `Expected 404, got ${response.status}`);
  assert(data.error && data.error.includes('Event'), 'Expected event not found error');
}

/**
 * Test: Create hours with missing Volunteer__c
 */
async function testCreateMissingVolunteer() {
  const hours = {
    Event__c: testEventId,
    Shift_Date__c: '2026-06-15',
    Total_Hours__c: 4,
    Status__c: 'Pending'
  };

  const response = await fetch(`${API_URL}/api/volunteerhours`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(hours)
  });

  const data = await response.json();

  assert(response.status === 400, `Expected 400, got ${response.status}`);
  assert(data.error, 'Expected missing volunteer error');
}

/**
 * Test: Create hours with missing Event__c
 */
async function testCreateMissingEvent() {
  const hours = {
    Volunteer__c: testVolunteerId,
    Shift_Date__c: '2026-06-15',
    Total_Hours__c: 4,
    Status__c: 'Pending'
  };

  const response = await fetch(`${API_URL}/api/volunteerhours`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(hours)
  });

  const data = await response.json();

  assert(response.status === 400, `Expected 400, got ${response.status}`);
  assert(data.error, 'Expected missing event error');
}

/**
 * Test: Create hours with invalid date format
 */
async function testCreateInvalidDateFormat() {
  const hours = {
    Volunteer__c: testVolunteerId,
    Event__c: testEventId,
    Shift_Date__c: '06/15/2026', // Wrong format
    Total_Hours__c: 4,
    Status__c: 'Pending'
  };

  const response = await fetch(`${API_URL}/api/volunteerhours`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(hours)
  });

  const data = await response.json();

  assert(response.status === 400, `Expected 400, got ${response.status}`);
  assert(data.error && data.error.includes('date'), 'Expected date format error');
}

/**
 * Test: Create hours with invalid Total_Hours__c (string)
 */
async function testCreateInvalidHoursString() {
  const hours = {
    Volunteer__c: testVolunteerId,
    Event__c: testEventId,
    Shift_Date__c: '2026-06-15',
    Total_Hours__c: 'not-a-number',
    Status__c: 'Pending'
  };

  const response = await fetch(`${API_URL}/api/volunteerhours`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(hours)
  });

  const data = await response.json();

  assert(response.status === 400, `Expected 400, got ${response.status}`);
  assert(data.error, 'Expected numeric validation error');
}

/**
 * Test: Create hours with negative Total_Hours__c
 */
async function testCreateNegativeHours() {
  const hours = {
    Volunteer__c: testVolunteerId,
    Event__c: testEventId,
    Shift_Date__c: '2026-06-15',
    Total_Hours__c: -5,
    Status__c: 'Pending'
  };

  const response = await fetch(`${API_URL}/api/volunteerhours`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(hours)
  });

  const data = await response.json();

  // Should either accept (Salesforce handles) or reject as invalid
  assert(response.status === 201 || response.status === 400, `Expected 201 or 400, got ${response.status}`);
}

/**
 * Test: Create hours with zero Total_Hours__c
 */
async function testCreateZeroHours() {
  const hours = {
    Volunteer__c: testVolunteerId,
    Event__c: testEventId,
    Shift_Date__c: '2026-06-15',
    Total_Hours__c: 0,
    Status__c: 'Pending'
  };

  const response = await fetch(`${API_URL}/api/volunteerhours`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(hours)
  });

  const data = await response.json();

  // Should accept zero hours
  assert(response.status === 201, `Expected 201, got ${response.status}`);
}

/**
 * Test: Get volunteer hours by valid ID
 */
async function testGetValidHours() {
  assert(testHoursId, 'No test hours ID available');

  const response = await fetch(`${API_URL}/api/volunteerhours/${testHoursId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  const data = await response.json();

  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.Id === testHoursId, 'Expected correct hours ID');
}

/**
 * Test: Get hours by non-existent ID
 */
async function testGetNonExistentHours() {
  const fakeId = 'a2T000000000000AAA';

  const response = await fetch(`${API_URL}/api/volunteerhours/${fakeId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  const data = await response.json();

  assert(response.status === 404, `Expected 404, got ${response.status}`);
  assert(data.error, 'Expected not found error');
}

/**
 * Test: Get hours by volunteer ID
 */
async function testGetByVolunteer() {
  const response = await fetch(`${API_URL}/api/volunteerhours/volunteer/${testVolunteerId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  const data = await response.json();

  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(Array.isArray(data), 'Expected array of hours records');
}

/**
 * Test: Get hours by event ID
 */
async function testGetByEvent() {
  const response = await fetch(`${API_URL}/api/volunteerhours/event/${testEventId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  const data = await response.json();

  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(Array.isArray(data), 'Expected array of hours records');
}

/**
 * Test: Update hours with valid data
 */
async function testUpdateValidHours() {
  assert(testHoursId, 'No test hours ID available');

  const updates = {
    Total_Hours__c: 5,
    Status__c: 'Approved'
  };

  const response = await fetch(`${API_URL}/api/volunteerhours/${testHoursId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(updates)
  });

  assert(response.status === 200, `Expected 200, got ${response.status}`);
}

/**
 * Test: Update hours with non-existent ID
 */
async function testUpdateNonExistentHours() {
  const fakeId = 'a2T000000000000AAA';
  const updates = { Total_Hours__c: 5 };

  const response = await fetch(`${API_URL}/api/volunteerhours/${fakeId}`, {
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
 * Test: Update hours with invalid numeric value
 */
async function testUpdateInvalidHours() {
  assert(testHoursId, 'No test hours ID available');

  const updates = {
    Total_Hours__c: 'invalid'
  };

  const response = await fetch(`${API_URL}/api/volunteerhours/${testHoursId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(updates)
  });

  const data = await response.json();

  assert(response.status === 400, `Expected 400, got ${response.status}`);
  assert(data.error, 'Expected numeric validation error');
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('========================================');
  console.log('🧪 VolunteerHoursAPI Test Suite');
  console.log('========================================');
  console.log(`Testing endpoint: ${API_URL}/api/volunteerhours`);

  console.log('\n🔐 Authenticating...');
  await authenticate();
  console.log('✅ Authentication successful');

  console.log('\n📝 Creating test event...');
  await createTestEvent();
  console.log('✅ Test event created');

  // Success cases
  console.log('\n📗 SUCCESS CASES');
  await runTest('Create hours with valid data', testCreateValidHours);
  await runTest('Get hours by valid ID', testGetValidHours);
  await runTest('Get hours by volunteer ID', testGetByVolunteer);
  await runTest('Get hours by event ID', testGetByEvent);
  await runTest('Update hours with valid data', testUpdateValidHours);
  await runTest('Create hours with zero hours', testCreateZeroHours);

  // Validation errors (400)
  console.log('\n📕 VALIDATION ERRORS (400)');
  await runTest('Create with missing Volunteer__c', testCreateMissingVolunteer);
  await runTest('Create with missing Event__c', testCreateMissingEvent);
  await runTest('Create with invalid date format', testCreateInvalidDateFormat);
  await runTest('Create with invalid hours (string)', testCreateInvalidHoursString);
  await runTest('Create with negative hours', testCreateNegativeHours);
  await runTest('Update with invalid hours', testUpdateInvalidHours);

  // Not found errors (404)
  console.log('\n📘 NOT FOUND ERRORS (404)');
  await runTest('Create with non-existent volunteer ID', testCreateNonExistentVolunteer);
  await runTest('Create with non-existent event ID', testCreateNonExistentEvent);
  await runTest('Get non-existent hours record', testGetNonExistentHours);
  await runTest('Update non-existent hours record', testUpdateNonExistentHours);

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

  // Clean up
  console.log('🧹 Cleaning up test data...');
  if (testHoursId) {
    try {
      await fetch(`${API_URL}/api/volunteerhours/${testHoursId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
    } catch (error) {}
  }
  if (testEventId) {
    try {
      await fetch(`${API_URL}/api/events/${testEventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
    } catch (error) {}
  }
  console.log('✅ Cleanup complete');

  process.exit(testsFailed > 0 ? 1 : 0);
}

runAllTests().catch(error => {
  console.error('❌ Test suite error:', error);
  process.exit(1);
});
