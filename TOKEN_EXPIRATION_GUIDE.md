# Token Expiration Testing Guide

## Understanding the Token

The `SF_ACCESS_TOKEN` in `.env` is the **admin user's session token**, obtained via SF CLI.

## Methods to Test Token Expiration

### Method 1: Use Invalid Token (Immediate Test)

Replace `SF_ACCESS_TOKEN` in `.env` with a fake token:
```
SF_ACCESS_TOKEN=00Dfj00000HPkAj!FAKE_EXPIRED_TOKEN
```

Then run:
```bash
node test-salesforce-apex-api.js
```

Expected result: `401 Unauthorized` error

### Method 2: Revoke Active Session (Immediate Test)

1. Login to Salesforce as admin: https://login.salesforce.com
2. Go to **Setup** → **Session Management** (search in Quick Find)
3. Find the active session with your current token
4. Click **Remove** to invalidate it
5. Run: `node test-salesforce-apex-api.js`

Expected result: `401 Unauthorized` error

### Method 3: Wait for Natural Expiration

Salesforce Developer Edition session tokens expire after **12-24 hours** of inactivity.

Simply wait and test later with:
```bash
node test-salesforce-apex-api.js
```

### Method 4: Test Token Simulation Script

Run the test suite that tries multiple token scenarios:
```bash
node test-token-expiration.js
```

This tests:
- ✅ Current valid token
- ❌ Simulated invalid token
- ❌ Malformed token

## How to Refresh After Expiration

### Automated Refresh:
```bash
node refresh-token.js
```

### Manual Refresh:
```powershell
# Get new token
$token = sf org display --target-org dev-org --json | ConvertFrom-Json | Select-Object -ExpandProperty result | Select-Object -ExpandProperty accessToken

# Display it
echo $token

# Copy and paste into .env file under SF_ACCESS_TOKEN=
```

### Prerequisites for Refresh:
You must be logged into SF CLI as the admin user:
```bash
# Check if logged in
sf org list

# If not logged in, authenticate
sf org login web --alias dev-org --instance-url https://login.salesforce.com
```

## Guest User Clarification

❌ The **guest user is NOT involved** in token refresh
✅ The guest user was created for potential future use (e.g., public API access)
✅ Token refresh requires **admin authentication** via SF CLI

## What Happens When Token Expires?

1. API calls return **401 Unauthorized**
2. Error message: `"Session expired or invalid"`
3. You must refresh the token using SF CLI (requires admin login)
4. Update `SF_ACCESS_TOKEN` in `.env` with new token
5. Resume API testing

## Testing Right Now

To test token expiration immediately:

```bash
# Backup current token
echo "Current token: $(grep SF_ACCESS_TOKEN .env)"

# Replace with invalid token in .env
# SF_ACCESS_TOKEN=00Dfj00000HPkAj!INVALID

# Test (should fail)
node test-salesforce-apex-api.js

# Restore valid token
node refresh-token.js

# Test again (should succeed)
node test-salesforce-apex-api.js
```
