/**
 * EventAPI Test Suite
 * Tests CRUD operations with various success and failure scenarios
 */

require('dotenv').config({ path: '../../.env' });

const BASE_URL = process.env.SF_SITE_URL || 'https://orgfarm-ea051935cf-dev-ed.develop.my.site.com/volunteerapivforcesite';
const API_URL = `${BASE_URL}/services/apexrest`;

// Get auth token first
const VALID_EMAIL = 'admin@cohap.org';
const VALID_PASSWORD = 'admin123';
let authToken = '';
let testEventId = '';

// Test results tracking
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
  assert(authToken, 'Failed to get auth token');
}

/**
 * Test: Create event with all valid fields
 */
async function testCreateValidEvent() {
  const event = {
    Title__c: `Test Event ${Date.now()}`,
    Description__c: 'This is a test event',
    Location__c: '123 Test St, Test City',
    Event_Date__c: '2026-06-15',
    Event_Time__c: '10:00 AM',
    Event_Status__c: 'Active',
    Max_Volunteers__c: 20,
    Current_Volunteers__c: 0,
    Duration_Hours__c: 4,
    Skills_Required__c: 'General Labor',
    Image_1_URL__c: 'https://example.com/image1.jpg',
    Image_2_URL__c: 'https://example.com/image2.jpg'
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

  assert(response.status === 201, `Expected 201, got ${response.status}`);
  assert(data.Id, 'Expected event ID in response');
  testEventId = data.Id;
}

/**
 * Test: Create event with missing Title__c
 */
async function testCreateMissingTitle() {
  const event = {
    Description__c: 'This is a test event',
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

  assert(response.status === 400, `Expected 400, got ${response.status}`);
  assert(data.error && data.error.includes('Title__c'), 'Expected missing Title error');
}

/**
 * Test: Create event with missing Description__c
 */
async function testCreateMissingDescription() {
  const event = {
    Title__c: 'Test Event',
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

  assert(response.status === 400, `Expected 400, got ${response.status}`);
  assert(data.error, 'Expected missing Description error');
}

/**
 * Test: Create event with invalid date format
 */
async function testCreateInvalidDateFormat() {
  const event = {
    Title__c: 'Test Event',
    Description__c: 'Test description',
    Location__c: '123 Test St',
    Event_Date__c: '06/15/2026', // Wrong format
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

  assert(response.status === 400, `Expected 400, got ${response.status}`);
  assert(data.error && data.error.includes('date'), 'Expected date format error');
}

/**
 * Test: Create event with invalid Max_Volunteers__c (not a number)
 */
async function testCreateInvalidMaxVolunteers() {
  const event = {
    Title__c: 'Test Event',
    Description__c: 'Test description',
    Location__c: '123 Test St',
    Event_Date__c: '2026-06-15',
    Event_Status__c: 'Active',
    Max_Volunteers__c: 'not-a-number'
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

  assert(response.status === 400, `Expected 400, got ${response.status}`);
  assert(data.error, 'Expected numeric validation error');
}

/**
 * Test: Create event with invalid URL format
 */
async function testCreateInvalidURL() {
  const event = {
    Title__c: 'Test Event',
    Description__c: 'Test description',
    Location__c: '123 Test St',
    Event_Date__c: '2026-06-15',
    Event_Status__c: 'Active',
    Image_1_URL__c: 'not-a-valid-url'
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

  assert(response.status === 400, `Expected 400, got ${response.status}`);
  assert(data.error && data.error.includes('URL'), 'Expected URL validation error');
}

/**
 * Test: Get event by valid ID
 */
async function testGetValidEvent() {
  assert(testEventId, 'No test event ID available');

  const response = await fetch(`${API_URL}/api/events/${testEventId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  const data = await response.json();

  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(data.Id === testEventId, 'Expected correct event ID');
}

/**
 * Test: Get event by non-existent ID
 */
async function testGetNonExistentEvent() {
  const fakeId = 'a2T000000000000AAA';

  const response = await fetch(`${API_URL}/api/events/${fakeId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  const data = await response.json();

  assert(response.status === 404, `Expected 404, got ${response.status}`);
  assert(data.error, 'Expected not found error');
}

/**
 * Test: Get all events
 */
async function testGetAllEvents() {
  const response = await fetch(`${API_URL}/api/events`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  const data = await response.json();

  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(Array.isArray(data), 'Expected array of events');
}

/**
 * Test: Update event with valid data
 */
async function testUpdateValidEvent() {
  assert(testEventId, 'No test event ID available');

  const updates = {
    Max_Volunteers__c: 30,
    Event_Time__c: '2:00 PM'
  };

  const response = await fetch(`${API_URL}/api/events/${testEventId}`, {
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
 * Test: Update event with non-existent ID
 */
async function testUpdateNonExistentEvent() {
  const fakeId = 'a2T000000000000AAA';
  const updates = { Max_Volunteers__c: 30 };

  const response = await fetch(`${API_URL}/api/events/${fakeId}`, {
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
 * Test: Update event with invalid date
 */
async function testUpdateInvalidDate() {
  assert(testEventId, 'No test event ID available');

  const updates = {
    Event_Date__c: '12/25/2026' // Wrong format
  };

  const response = await fetch(`${API_URL}/api/events/${testEventId}`, {
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
 * Test: Delete event with valid ID
 */
async function testDeleteValidEvent() {
  // Create a temporary event to delete
  const tempEvent = {
    Title__c: `Temp Event ${Date.now()}`,
    Description__c: 'Temporary event for delete test',
    Location__c: '123 Test St',
    Event_Date__c: '2026-06-15',
    Event_Status__c: 'Active'
  };

  const createResponse = await fetch(`${API_URL}/api/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(tempEvent)
  });

  const createdEvent = await createResponse.json();
  const tempEventId = createdEvent.Id;

  // Now delete it
  const response = await fetch(`${API_URL}/api/events/${tempEventId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  assert(response.status === 200 || response.status === 204, `Expected 200 or 204, got ${response.status}`);
}

/**
 * Test: Delete event with non-existent ID
 */
async function testDeleteNonExistentEvent() {
  const fakeId = 'a2T000000000000AAA';

  const response = await fetch(`${API_URL}/api/events/${fakeId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  const data = await response.json();

  assert(response.status === 404, `Expected 404, got ${response.status}`);
  assert(data.error, 'Expected not found error');
}

/**
 * Test: Create event with negative Max_Volunteers__c
 */
async function testCreateNegativeMaxVolunteers() {
  const event = {
    Title__c: 'Test Event',
    Description__c: 'Test description',
    Location__c: '123 Test St',
    Event_Date__c: '2026-06-15',
    Event_Status__c: 'Active',
    Max_Volunteers__c: -5
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

  // Should either accept it (Salesforce handles) or reject as invalid
  assert(response.status === 201 || response.status === 400, `Expected 201 or 400, got ${response.status}`);
}

/**
 * Test: Create event with past date
 */
async function testCreatePastDate() {
  const event = {
    Title__c: 'Past Event',
    Description__c: 'Event in the past',
    Location__c: '123 Test St',
    Event_Date__c: '2020-01-01',
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

  // Should succeed (business logic doesn't prevent past dates)
  assert(response.status === 201, `Expected 201, got ${response.status}`);
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('========================================');
  console.log('🧪 EventAPI Test Suite');
  console.log('========================================');
  console.log(`Testing endpoint: ${API_URL}/api/events`);

  console.log('\n🔐 Authenticating...');
  await authenticate();
  console.log('✅ Authentication successful');

  // Success cases
  console.log('\n📗 SUCCESS CASES');
  await runTest('Create event with valid data', testCreateValidEvent);
  await runTest('Get event by valid ID', testGetValidEvent);
  await runTest('Get all events', testGetAllEvents);
  await runTest('Update event with valid data', testUpdateValidEvent);
  await runTest('Delete event with valid ID', testDeleteValidEvent);
  await runTest('Create event with past date', testCreatePastDate);

  // Validation errors (400)
  console.log('\n📕 VALIDATION ERRORS (400)');
  await runTest('Create with missing Title__c', testCreateMissingTitle);
  await runTest('Create with missing Description__c', testCreateMissingDescription);
  await runTest('Create with invalid date format', testCreateInvalidDateFormat);
  await runTest('Create with invalid Max_Volunteers (string)', testCreateInvalidMaxVolunteers);
  await runTest('Create with invalid URL format', testCreateInvalidURL);
  await runTest('Update with invalid date format', testUpdateInvalidDate);
  await runTest('Create with negative Max_Volunteers', testCreateNegativeMaxVolunteers);

  // Not found errors (404)
  console.log('\n📘 NOT FOUND ERRORS (404)');
  await runTest('Get non-existent event', testGetNonExistentEvent);
  await runTest('Update non-existent event', testUpdateNonExistentEvent);
  await runTest('Delete non-existent event', testDeleteNonExistentEvent);

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

  // Clean up test event
  if (testEventId) {
    console.log('🧹 Cleaning up test data...');
    try {
      await fetch(`${API_URL}/api/events/${testEventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      console.log('✅ Test event deleted');
    } catch (error) {
      console.log('⚠️  Could not delete test event');
    }
  }

  process.exit(testsFailed > 0 ? 1 : 0);
}

runAllTests().catch(error => {
  console.error('❌ Test suite error:', error);
  process.exit(1);
});
