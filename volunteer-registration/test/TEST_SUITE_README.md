# API Test Suite Documentation

Comprehensive test suites for all Volunteer Management API endpoints covering success cases, validation failures, and edge cases.

## Overview

The test suite validates:
- ✅ **Authentication**: Login with valid/invalid credentials
- ✅ **Validation**: Missing fields, invalid formats, incorrect data types
- ✅ **Duplicate Prevention**: Email uniqueness, registration uniqueness
- ✅ **Data Integrity**: Non-existent IDs, foreign key validation
- ✅ **Edge Cases**: Negative numbers, past dates, SQL injection attempts
- ✅ **Authorization**: Token validation, unauthorized access

## Test Files

```
volunteer-registration/test/
├── run-all-tests.js              # Master test runner
├── test-auth-api.js              # AuthAPI test suite (16 tests)
├── test-volunteer-api.js         # VolunteerAPI test suite (18 tests)
├── test-event-api.js             # EventAPI test suite (17 tests)
├── test-registration-api.js      # RegistrationAPI test suite (14 tests)
└── test-volunteerhours-api.js    # VolunteerHoursAPI test suite (17 tests)
```

**Total Tests: 82+**

## Prerequisites

1. **Environment configured**: `.env` file with `SF_SITE_URL`
2. **Salesforce site active**: Volunteer API site at `/volunteerapivforcesite`
3. **Test data seeded**: Run `npm run seed` in `database/` folder
4. **Node.js installed**: v14+ with native fetch support

## Quick Start

### Run All Tests

```bash
cd volunteer-registration/test
node run-all-tests.js
```

**Output:**
```
╔═══════════════════════════════════════════════════════════╗
║     VOLUNTEER MANAGEMENT API - COMPREHENSIVE TEST SUITE   ║
╚═══════════════════════════════════════════════════════════╝

📋 Total Test Suites: 5

🚀 Running: AuthAPI
   Authentication endpoint tests
========================================
✅ Passed: 15/16 tests (93.8% success rate)

🚀 Running: VolunteerAPI
   Volunteer CRUD operations
========================================
✅ Passed: 18/18 tests (100% success rate)

... (remaining suites)

╔═══════════════════════════════════════════════════════════╗
║                    FINAL TEST REPORT                      ║
╚═══════════════════════════════════════════════════════════╝

📊 SUMMARY:
   Total Suites:        5
   ✅ Passed:          5
   ❌ Failed:          0
   ⏱️  Total Duration:   45.2s
   📊 Success Rate:     100%
```

### Run Individual Test Suites

```bash
# Test authentication
node test-auth-api.js

# Test volunteer API
node test-volunteer-api.js

# Test event API
node test-event-api.js

# Test registration API
node test-registration-api.js

# Test volunteer hours API
node test-volunteerhours-api.js
```

## Test Coverage by API

### 1. AuthAPI (test-auth-api.js)

**Endpoint:** `POST /api/auth/login`

**Success Cases:**
- ✅ Valid login with correct credentials

**Validation Errors (400):**
- ❌ Missing email field
- ❌ Missing password field
- ❌ Missing both fields
- ❌ Empty email
- ❌ Empty password
- ❌ Invalid email format
- ❌ Null email
- ❌ Null password
- ❌ Invalid JSON payload

**Authentication Errors (401):**
- ❌ Non-existent email
- ❌ Incorrect password
- ❌ SQL injection attempt

**Authorization Errors (403):**
- ❌ Inactive volunteer account

**Edge Cases:**
- ⚠️ Missing Content-Type header

**Total: 16 tests**

---

### 2. VolunteerAPI (test-volunteer-api.js)

**Endpoints:** `/api/volunteers`, `/api/volunteers/{id}`

**Success Cases:**
- ✅ Create volunteer with valid data
- ✅ Get volunteer by valid ID
- ✅ Get all volunteers
- ✅ Update volunteer with valid data
- ✅ Create with extra unknown fields (ignored)

**Validation Errors (400):**
- ❌ Missing First_Name__c
- ❌ Missing Email__c
- ❌ Invalid email format
- ❌ Invalid date format (Date_of_Birth__c)
- ❌ Invalid phone format
- ❌ Invalid ID format

**Authentication Errors (401):**
- ❌ Request without auth header
- ❌ Request with invalid token

**Not Found Errors (404):**
- ❌ Get non-existent volunteer
- ❌ Update non-existent volunteer

**Conflict Errors (409):**
- ❌ Duplicate email address

**Total: 18 tests**

---

### 3. EventAPI (test-event-api.js)

**Endpoints:** `/api/events`, `/api/events/{id}`

**Success Cases:**
- ✅ Create event with valid data
- ✅ Get event by valid ID
- ✅ Get all events
- ✅ Update event with valid data
- ✅ Delete event with valid ID
- ✅ Create event with past date (allowed)

**Validation Errors (400):**
- ❌ Missing Title__c
- ❌ Missing Description__c
- ❌ Invalid date format (Event_Date__c)
- ❌ Invalid Max_Volunteers__c (string instead of number)
- ❌ Invalid URL format (Image_1_URL__c)
- ❌ Negative Max_Volunteers__c
- ❌ Update with invalid date format

**Not Found Errors (404):**
- ❌ Get non-existent event
- ❌ Update non-existent event
- ❌ Delete non-existent event

**Total: 17 tests**

---

### 4. RegistrationAPI (test-registration-api.js)

**Endpoints:** `/api/registrations`, `/api/registrations/{id}`, `/api/registrations/volunteer/{id}`, `/api/registrations/event/{id}`

**Success Cases:**
- ✅ Create registration with valid data
- ✅ Get registration by valid ID
- ✅ Get registrations by volunteer ID
- ✅ Get registrations by event ID
- ✅ Update registration with valid data

**Validation Errors (400):**
- ❌ Missing Volunteer__c
- ❌ Missing Event__c
- ❌ Invalid date format (Registration_Date__c)

**Not Found Errors (404):**
- ❌ Create with non-existent volunteer ID
- ❌ Create with non-existent event ID
- ❌ Get non-existent registration
- ❌ Update non-existent registration

**Conflict Errors (409):**
- ❌ Duplicate registration (same volunteer + event)

**Total: 14 tests**

---

### 5. VolunteerHoursAPI (test-volunteerhours-api.js)

**Endpoints:** `/api/volunteerhours`, `/api/volunteerhours/{id}`, `/api/volunteerhours/volunteer/{id}`, `/api/volunteerhours/event/{id}`

**Success Cases:**
- ✅ Create hours with valid data
- ✅ Get hours by valid ID
- ✅ Get hours by volunteer ID
- ✅ Get hours by event ID
- ✅ Update hours with valid data
- ✅ Create hours with zero hours (edge case)

**Validation Errors (400):**
- ❌ Missing Volunteer__c
- ❌ Missing Event__c
- ❌ Invalid date format (Shift_Date__c)
- ❌ Invalid Total_Hours__c (string instead of number)
- ❌ Negative Total_Hours__c
- ❌ Update with invalid numeric value

**Not Found Errors (404):**
- ❌ Create with non-existent volunteer ID
- ❌ Create with non-existent event ID
- ❌ Get non-existent hours record
- ❌ Update non-existent hours record

**Total: 17 tests**

---

## Test Results Interpretation

### Exit Codes

- **0**: All tests passed
- **1**: One or more tests failed

### Status Indicators

- ✅ **PASS**: Test succeeded, behavior as expected
- ❌ **FAIL**: Test failed, unexpected behavior or error
- ⚠️ **WARNING**: Test passed with notes (e.g., edge case)

### Common Failure Reasons

1. **API endpoint not accessible**
   - Check `SF_SITE_URL` in `.env`
   - Verify site is Active in Salesforce

2. **Authentication failures**
   - Check test credentials exist: `admin@cohap.org` / `admin123`
   - Run seed script: `cd database && npm run seed`

3. **Validation not working**
   - Verify Apex classes deployed with validations
   - Check ValidationUtils.cls is deployed

4. **Timeout errors**
   - Salesforce org may be slow
   - Increase timeout in test scripts

## Customization

### Modify Test Credentials

Edit each test file's credentials:

```javascript
const VALID_EMAIL = 'your-email@example.com';
const VALID_PASSWORD = 'your-password';
```

### Add New Tests

Add test function in appropriate test suite:

```javascript
async function testYourNewTest() {
  const response = await fetch(`${API_URL}/api/volunteers`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  const data = await response.json();
  
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  assert(Array.isArray(data), 'Expected array');
}
```

Register in `runAllTests()`:

```javascript
await runTest('Your new test description', testYourNewTest);
```

### Create New Test Suite

1. Copy an existing test file
2. Update endpoint URLs
3. Update test cases
4. Add to `run-all-tests.js`:

```javascript
const testSuites = [
  // ... existing suites
  { name: 'YourAPI', file: 'test-your-api.js', description: 'Your API tests' }
];
```

## CI/CD Integration

### GitHub Actions

Add to `.github/workflows/salesforce-deploy.yml`:

```yaml
- name: Run API Tests
  run: |
    cd volunteer-registration/test
    node run-all-tests.js
  env:
    SF_SITE_URL: ${{ secrets.SF_SITE_URL }}
```

### Pre-Commit Hook

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
cd volunteer-registration/test
node run-all-tests.js
exit $?
```

## Troubleshooting

### All tests fail with "fetch is not defined"

**Cause:** Node.js version < 18

**Fix:** Upgrade to Node.js 18+ or install node-fetch:
```bash
npm install node-fetch
```

Then add to test files:
```javascript
const fetch = require('node-fetch');
```

### Tests fail with "Invalid SFDX Auth URL"

**Cause:** Wrong `SF_SITE_URL` in `.env`

**Fix:**
1. Verify site URL in Salesforce: Setup → Sites
2. Update `.env`:
   ```env
   SF_SITE_URL=https://your-org.develop.my.site.com/volunteerapivforcesite
   ```

### "Volunteer not found" errors

**Cause:** Test data not seeded

**Fix:**
```bash
cd ../../database
npm install
npm run seed
```

### Tests timeout

**Cause:** Salesforce org slow response

**Fix:** Increase timeout in test:
```javascript
// Add timeout to fetch
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000); // 30s

const response = await fetch(url, {
  ...options,
  signal: controller.signal
});
```

## Best Practices

1. **Run tests before deployment**
   ```bash
   node run-all-tests.js && sf project deploy start
   ```

2. **Clean up test data regularly**
   ```bash
   node cleanup-all.js
   ```

3. **Review failed tests immediately**
   - Don't ignore failures
   - Fix root cause before deploying

4. **Add tests for new features**
   - Every new API endpoint needs tests
   - Cover success and failure cases

5. **Monitor test execution time**
   - Slow tests indicate performance issues
   - Optimize API responses if needed

## Additional Resources

- [Main README](../../README.md) - Project overview
- [API Documentation](../../volunteer-registration/README.md) - API reference
- [APEX Validations](../../APEX_VALIDATIONS.md) - Validation details
- [Troubleshooting](../../TROUBLESHOOTING.md) - Common issues

## Support

For issues with tests:
1. Check error messages in test output
2. Run individual test suite for detailed info
3. Review Salesforce debug logs: `sf apex log tail`
4. Open GitHub issue with test output
