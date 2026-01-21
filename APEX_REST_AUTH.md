# Salesforce Apex REST API Authentication Guide

## Problem
Salesforce Apex REST endpoints require authentication. The login endpoint needs to be accessible without a token (chicken-and-egg problem).

## Solutions

### Option 1: Two-Stage Authentication (Recommended for Salesforce-Only Deployment)

**Stage 1: Get Salesforce OAuth Token**
```
POST https://login.salesforce.com/services/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=password
&client_id=<CONNECTED_APP_CLIENT_ID>
&client_secret=<CONNECTED_APP_CLIENT_SECRET>
&username=<SERVICE_ACCOUNT_USERNAME>
&password=<SERVICE_ACCOUNT_PASSWORD><SECURITY_TOKEN>
```

**Stage 2: Call Login Endpoint with Salesforce Token**
```
POST https://orgfarm-ea051935cf-dev-ed.develop.my.salesforce.com/services/apexrest/api/auth/login
Authorization: Bearer <SALESFORCE_OAUTH_TOKEN>
Content-Type: application/json

{
  "email": "admin@cohap.org",
  "password": "admin123"
}
```

This returns your JWT token for application use.

### Option 2: Use Named Credentials (Internal Salesforce Calls Only)

For Salesforce-to-Salesforce calls, use Named Credentials with pre-configured authentication.

### Option 3: Salesforce Experience Cloud Site (Enterprise/Unlimited Edition)

Enable guest user REST API access through an Experience Cloud site.

### Option 4: Hybrid Approach (Current Implementation)

- **Public Login:** Use Node.js backend at `http://localhost:4000/auth/login`
- **Protected Endpoints:** Use Apex REST API with JWT token validation
- **Deployment:** Deploy Node.js to Heroku, Render, or Railway

## Current Setup

### Node.js Backend (Development/Staging)
```
POST http://localhost:4000/auth/login
Body: {"email": "admin@cohap.org", "password": "admin123"}
Returns: JWT token
```

### Apex REST API (Production - Requires SF Auth)
```
POST https://orgfarm-ea051935cf-dev-ed.develop.my.salesforce.com/services/apexrest/api/auth/login
Authorization: Bearer <SALESFORCE_ACCESS_TOKEN>
Body: {"email": "admin@cohap.org", "password": "admin123"}
Returns: JWT token
```

## Recommendation

For a **Salesforce-only deployment** with Developer Edition limitations:

1. Create a **Connected App** in Salesforce
2. Frontend authenticates with Salesforce OAuth first
3. Use that Salesforce token to call Apex REST endpoints
4. Apex REST endpoints validate business credentials and return app JWT

This way everything stays in Salesforce, but uses Salesforce's built-in OAuth for initial authentication.
