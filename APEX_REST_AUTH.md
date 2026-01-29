# Salesforce Apex REST API Authentication Guide

## Getting Started with OAuth 2.0 Authentication

### Step 1: Locate the Connected App in Salesforce

1. Log into your Salesforce org
2. Click the **gear icon** (⚙️) in the top right corner
3. Select **Setup**
4. In the Setup search box, type **"App Manager"**
5. Click **App Manager** from the results
6. Locate **"Volunteer Management API"** in the list
7. Click the **dropdown arrow** on the right side of the app name
8. Select **"Manage"** or **"View"**

### Step 2: Find and Copy Consumer Key and Secret

In the Connected App details page:

1. Scroll to the **"API (Enable OAuth Settings)"** section (marked with a yellow warning badge)
2. Look for the **"Consumer Key and Secret"** row
3. Click the **"Manage Consumer Details"** button
4. A new window will open showing:
   - **Consumer Key** (always visible)
   - **Consumer Secret** (click **"Reveal"** to see it)
5. **Copy both values** - you'll need them for Postman

### Step 2.5: Create a Service Account (Recommended for Production)

To avoid 2FA prompts and enable programmatic API access:

1. In Salesforce Setup, go to **Administration** → **Users** → **Users**
2. Click **"New User"**
3. Fill in the form:
   - **First Name:** API
   - **Last Name:** Service Account
   - **Email:** `api-service@your-org.salesforce.com` (must be unique)
   - **Username:** `api-service@your-org.salesforce.com`
   - **User License:** Salesforce
   - **Profile:** System Administrator (or custom profile with API permissions)
4. Click **Save**
5. **Disable 2FA for this user:**
   - Click the user name
   - Click **Edit**
   - Scroll to **Two-Factor Authentication**
   - Uncheck **Require two-factor authentication**
   - Click **Save**
6. **Set a password:**
   - Click **Reset Password** (Salesforce sends a temporary password to the email)
   - Use this password in your `.env` file

**Update your `.env` file:**
```dotenv
SF_USERNAME=api-service@your-org.salesforce.com
SF_PASSWORD=<password-from-reset>
SF_CLIENT_ID=<Consumer Key>
SF_CLIENT_SECRET=<Consumer Secret>
```

### Step 3: Configure Salesforce Custom Site

Your Apex REST endpoints are hosted on a Custom Site. The site requires specific security settings:

**Required Fields in CustomSite metadata:**
- `browserXssProtection` - XSS attack prevention
- `clickjackProtectionLevel` - Clickjack attack prevention (use `SameOriginOnly`)
- `contentSniffingProtection` - Content type sniffing prevention
- `indexPage` - Landing page (e.g., `Home`)
- `masterLabel` - User-friendly site name
- `referrerPolicyOriginWhenCrossOrigin` - Referrer policy for cross-origin requests

Example metadata file:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomSite xmlns="http://soap.sforce.com/2006/04/metadata">
    <active>true</active>
    <allowHomePage>false</allowHomePage>
    <browserXssProtection>true</browserXssProtection>
    <clickjackProtectionLevel>SameOriginOnly</clickjackProtectionLevel>
    <contentSniffingProtection>true</contentSniffingProtection>
    <indexPage>Home</indexPage>
    <masterLabel>Volunteer API</masterLabel>
    <siteAdmin>your-email@example.com</siteAdmin>
    <siteType>Visualforce</siteType>
    <subdomain>volunteerapi</subdomain>
    <urlPathPrefix>volunteer</urlPathPrefix>
    <referrerPolicyOriginWhenCrossOrigin>true</referrerPolicyOriginWhenCrossOrigin>
</CustomSite>
```

### Step 4: Set Up Postman OAuth 2.0 Authentication

1. **Open your login endpoint request in Postman**
   - Method: `POST`
   - URL: `https://volunteerapi.orgfarm-ea051935cf-dev-ed.develop.my.salesforce.com/volunteer/services/apexrest/api/auth/login`

2. **Click the "Authorization" tab**

3. **Select "OAuth 2.0"** from the Type dropdown

4. **Click "Get New Access Token"**

5. **Fill in the OAuth 2.0 configuration:**

| Field | Value |
|-------|-------|
| **Token Name** | Salesforce Volunteer API |
| **Grant Type** | Authorization Code |
| **Callback URL** | `https://login.salesforce.com/services/oauth2/success` |
| **Auth URL** | `https://login.salesforce.com/services/oauth2/authorize` |
| **Access Token URL** | `https://login.salesforce.com/services/oauth2/token` |
| **Client ID** | (Paste your Consumer Key from Step 2) |
| **Client Secret** | (Paste your Consumer Secret from Step 2) |
| **Scope** | `refresh_token` |
| **Client Authentication** | Send as Basic Auth header |

6. **Click "Request Token"**

7. **Authenticate in the browser window:**
   - Salesforce will open a login window
   - Enter your Salesforce credentials
   - Click **Allow** to authorize Postman

8. **Success!** Postman will capture your access token and display it in the **"Current Token"** section

### Step 5: Create Required Permission Sets

Create a permission set to grant API access:

**File:** `force-app/default/permissionsets/VolunteerAPIAccess.permissionset-meta.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<PermissionSet xmlns="http://soap.sforce.com/2006/04/metadata">
    <description>Permission set for Volunteer API access</description>
    <label>Volunteer API Access</label>
    <userPermissions>
        <enabled>true</enabled>
        <name>ApiEnabled</name>
    </userPermissions>
</PermissionSet>
```

### Step 6: Update Deployment Workflow

Add permission set assignment to your deployment workflow:

```yaml
- name: Assign Permission Sets
  run: |
    echo "Assigning permission sets..."
    sf org assign permset --name VolunteerAPIAccess || echo "Permission set assignment completed or skipped"
  working-directory: ./volunteer-registration
  continue-on-error: true
```

## Testing Your Configuration

Once authenticated in Postman:

1. **Set Request Body** (raw JSON):
```json
{
  "email": "admin@example.com",
  "password": "your_password"
}
```

2. **Send the request**

3. **Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "jwt_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "volunteer_id": "a0z1n000001..."
}
```

## Troubleshooting

### Error: "Required field is missing: browserXssProtection"
- Update your CustomSite metadata with all required security fields
- Redeploy using `sf project deploy start`

### Error: "Unknown user permission: CanUseWebLink"
- Check permission set for invalid permission names
- Use only valid Salesforce permissions (e.g., `ApiEnabled`)

### Error: "Permission set 'VolunteerAPIAccess' not found"
- Ensure the permission set file exists in `force-app/default/permissionsets/`
- Run full deployment before assigning permission set

### Redirect URL mismatch error in Postman
- Verify your Callback URL matches exactly what's configured
- Use the Postman default or configure an exact redirect URI in Connected App

## Problem
Salesforce Apex REST endpoints require authentication. The login endpoint needs to be accessible without a token (chicken-and-egg problem).

## Solutions

### Option 1: Two-Stage Authentication (Recommended for Salesforce-Only Deployment)

**Stage 1: Get Salesforce OAuth Token**

**cURL Command:**
```bash
curl -X POST https://login.salesforce.com/services/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "username=api-service@your-org.salesforce.com" \
  -d "password=YOUR_PASSWORD"
```

**JavaScript Implementation (for UI):**

Copy this snippet into your frontend application to get Salesforce OAuth tokens:

```javascript
/**
 * Get Salesforce OAuth Token using Username-Password Flow
 * This avoids 2FA prompts by using a service account
 */
async function getSalesforceOAuthToken() {
  const clientId = process.env.REACT_APP_SF_CLIENT_ID || 'YOUR_CLIENT_ID';
  const clientSecret = process.env.REACT_APP_SF_CLIENT_SECRET || 'YOUR_CLIENT_SECRET';
  const username = 'api-service@your-org.salesforce.com';
  const password = process.env.REACT_APP_SF_PASSWORD || 'YOUR_PASSWORD';
  const loginUrl = 'https://login.salesforce.com/services/oauth2/token';

  try {
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: clientId,
        client_secret: clientSecret,
        username: username,
        password: password,
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`Salesforce OAuth failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      accessToken: data.access_token,
      instanceUrl: data.instance_url,
      expiresIn: data.expires_in,
    };
  } catch (error) {
    console.error('Error getting Salesforce OAuth token:', error);
    throw error;
  }
}

/**
 * Call Apex REST Login Endpoint with Salesforce Token
 */
async function loginToVolunteerApp(email, password) {
  try {
    // Get Salesforce token first
    const { accessToken, instanceUrl } = await getSalesforceOAuthToken();

    // Call your Apex REST login endpoint
    const response = await fetch(
      `${instanceUrl}/services/apexrest/api/auth/login`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Store JWT token for future requests
    localStorage.setItem('jwtToken', data.jwt_token);
    localStorage.setItem('volunteerId', data.volunteer_id);

    return data;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
}

// Usage in React component:
// const handleLogin = async () => {
//   const result = await loginToVolunteerApp(email, password);
//   console.log('Login successful!', result);
// };
```

**Environment Variables (.env.local for React):**
```
REACT_APP_SF_CLIENT_ID=your_consumer_key_here
REACT_APP_SF_CLIENT_SECRET=your_consumer_secret_here
REACT_APP_SF_PASSWORD=service_account_password_here
```

**Raw HTTP Request:**
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
