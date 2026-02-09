# Apex API Data Validation Implementation

## Overview
Comprehensive data validation has been implemented across all Salesforce Apex REST API endpoints to ensure data integrity, prevent duplicates, and provide clear error messages.

## Enhanced ValidationUtils Class

### New Validation Methods Added:
1. **`isValidDateFormat(String dateStr)`** - Validates YYYY-MM-DD format
2. **`isValidDateTimeFormat(String dateTimeStr)`** - Validates ISO 8601 datetime format
3. **`isValidTimeFormat(String timeStr)`** - Validates HH:MM:SS format
4. **`isValidNumber(Object value)`** - Validates numeric fields
5. **`isValidURL(String url)`** - Validates URL format
6. **`isDuplicateEmail(String email, String excludeId)`** - Checks for duplicate volunteer emails
7. **`isDuplicateRegistration(String volunteerId, String eventId, String excludeId)`** - Checks for duplicate event registrations
8. **`recordExists(String objectName, String recordId)`** - Verifies record existence before operations
9. **`createValidationErrorResponse(Map<String, String> fieldErrors)`** - Creates structured validation error responses

## API Endpoint Validations

### 1. VolunteerAPI (`/api/volunteers/*`)

#### POST - Create Volunteer
- ✅ Request body validation (non-null, non-empty JSON)
- ✅ Required fields validation:
  - First_Name__c, Last_Name__c, Email__c
  - Date_of_Birth__c, Volunteer_Type__c, T_Shirt_Size__c
  - Why_Volunteer__c, Community_Service_Hours__c
  - Offender_Policy_Confirmed__c, Electronic_Signature__c
  - Signature_Date__c, Registration_Date__c, Status__c
- ✅ Email format validation (regex pattern)
- ✅ Duplicate email prevention (409 Conflict)
- ✅ Phone number format validation (optional field)
- ✅ Date format validation (YYYY-MM-DD) for:
  - Date_of_Birth__c
  - Registration_Date__c
  - Signature_Date__c
- ✅ Password hashing using SHA-256 (Apex-compatible)

#### GET - Retrieve Volunteer(s)
- ✅ ID format validation (15 or 18 character Salesforce ID)
- ✅ Empty/placeholder ID detection (:id, null, undefined)
- ✅ 404 error for non-existent volunteer

#### PUT - Update Volunteer
- ✅ ID validation
- ✅ Record existence check
- ✅ Duplicate email check (excluding current record)
- ✅ Date format validation on updates

### 2. EventAPI (`/api/events/*`)

#### POST - Create Event
- ✅ Request body validation (non-null, non-empty JSON)
- ✅ Required fields validation:
  - Title__c, Description__c, Location__c
  - Event_Date__c, Event_Status__c
- ✅ Event_Date__c format validation (YYYY-MM-DD)
- ✅ Max_Volunteers__c numeric validation
- ✅ Image URL format validation (Image_1_URL__c, Image_2_URL__c, Image_3_URL__c)

#### GET - Retrieve Event(s)
- ✅ ID format validation
- ✅ Empty/placeholder ID detection
- ✅ 404 error for non-existent event

#### PUT - Update Event
- ✅ ID validation
- ✅ Record existence check (404 if not found)
- ✅ Request body validation
- ✅ Date format validation
- ✅ Numeric field validation (Max_Volunteers__c)

#### DELETE - Delete Event
- ✅ ID validation
- ✅ Record existence check before deletion
- ✅ 404 error for non-existent event

### 3. RegistrationAPI (`/api/registrations/*`)

#### POST - Create Registration
- ✅ Request body validation (non-null, non-empty JSON)
- ✅ Required fields validation:
  - Volunteer__c (with custom "Volunteer id is empty" message)
  - Event__c (with custom "Event id is empty" message)
  - Registration_Status__c
- ✅ Volunteer ID format validation
- ✅ Event ID format validation
- ✅ Volunteer existence check (404 if not found)
- ✅ Event existence check (404 if not found)
- ✅ **Duplicate registration prevention** (409 Conflict)
  - Same volunteer cannot register for same event twice
- ✅ Registration_Date__c format validation (YYYY-MM-DD)

#### GET - Retrieve Registration(s)
- ✅ ID format validation
- ✅ Empty/placeholder ID detection
- ✅ 404 error for non-existent registration
- ✅ Validation for volunteer-specific queries (`/api/registrations/volunteer/:id`)
- ✅ Validation for event-specific queries (`/api/registrations/event/:id`)

#### PUT - Update Registration
- ✅ ID validation
- ✅ Record existence check
- ✅ Request body validation

### 4. VolunteerHoursAPI (`/api/volunteerhours/*`)

#### POST - Create Volunteer Hours
- ✅ Request body validation (non-null, non-empty JSON)
- ✅ Required fields validation:
  - Volunteer__c, Shift_Date__c, Clock_In_Time__c
- ✅ Volunteer ID format validation
- ✅ **Volunteer existence check** (404 if not found)
- ✅ Event ID format validation (if provided)
- ✅ **Event existence check** (404 if not found)
- ✅ Shift_Date__c format validation (YYYY-MM-DD)
- ✅ Total_Hours__c numeric validation
- ✅ Automatic total hours calculation from clock in/out times

#### GET - Retrieve Volunteer Hours
- ✅ ID format validation
- ✅ Empty/placeholder ID detection
- ✅ 404 error for non-existent volunteer hours
- ✅ Validation for volunteer-specific queries
- ✅ Validation for event-specific queries
- ✅ Validation for combined event/volunteer queries

### 5. AuthAPI (`/api/auth/login`)
- ✅ Email and password required validation
- ✅ Email format validation
- ✅ SHA-256 password verification (Apex-compatible)
- ✅ Volunteer status check (Inactive/Suspended accounts blocked)
- ✅ 401 Unauthorized for invalid credentials
- ✅ 403 Forbidden for inactive/suspended accounts
- ✅ JWT token generation on successful login

## Error Response Standards

### HTTP Status Codes:
- **400 Bad Request** - Missing required fields, invalid formats, invalid data types
- **401 Unauthorized** - Invalid login credentials
- **403 Forbidden** - Account suspended/inactive
- **404 Not Found** - Record doesn't exist
- **409 Conflict** - Duplicate record (email, registration)
- **500 Internal Server Error** - Unexpected server errors

### Error Message Format:
```json
{
  "message": "Descriptive error message"
}
```

### Validation Error Format:
```json
{
  "message": "Validation failed",
  "errors": {
    "field_name": "Error message"
  }
}
```

## Password Hashing

**Important:** Changed from bcrypt (Node.js) to SHA-256 (Apex-compatible)

### Reason:
- Apex doesn't support bcrypt natively
- SHA-256 is available via Apex Crypto class
- Ensures consistent password verification between Node.js seeding and Apex API

### Implementation:
- **Node.js (seedData.js):** `crypto.createHash('sha256').update(password).digest('hex')`
- **Apex (PasswordUtils.cls):** `Crypto.generateDigest('SHA-256', Blob.valueOf(password))`

## Testing

### Test Scripts Created:
1. **`test-salesforce-apex-api.js`** - Tests Apex REST API authentication endpoint
2. **`cleanup-all.js`** - Cleans up all test data (Volunteer Hours → Registrations → Volunteers → Events)
3. **`query-volunteer.js`** - Queries volunteer records to verify data
4. **`test-hash.js`** - Tests SHA-256 hash generation

### Successful Test Result:
```
✅ SUCCESS! Salesforce Apex API working!
Response: {
  "message": "Login successful",
  "volunteer": { ... },
  "token": "eyJ0eXAiOiJKV1Q..."
}
```

## Deployment

All validations are deployed to Salesforce org:
```bash
sf project deploy start --source-dir force-app/default/classes --target-org dev-org
```

**Status:** ✅ Deployed successfully
- ValidationUtils (enhanced)
- PasswordUtils (SHA-256 compatibility)
- AuthAPI, VolunteerAPI, EventAPI, RegistrationAPI, VolunteerHoursAPI

## Benefits

1. **Data Integrity** - Prevents invalid data from entering Salesforce
2. **No Duplicates** - Email and registration duplicate prevention
3. **Clear Errors** - Descriptive error messages for debugging
4. **Type Safety** - Validates data types before database operations
5. **Foreign Key Validation** - Ensures referenced records exist
6. **Consistent Format** - Standardized date/time/URL formats
7. **Security** - Proper password hashing and validation

## Future Enhancements

Potential additions:
- Date range validation (e.g., Date_of_Birth must be in the past)
- Business logic validation (e.g., Max_Volunteers not exceeded)
- Custom validation rules per organization requirements
- Field-level permissions validation
- Rate limiting per user/profile
