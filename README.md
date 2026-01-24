# Volunteer Management API

This repository contains a simple REST API built with Node.js, Express, and Salesforce (sfdx) for managing Volunteers, Events, and Registrations (shift sign-ups).

Features
- User registration and login (username/password) with JWT-based authentication
- CRUD for Events and Volunteers
- Create / Cancel Registrations with checks: event active, shift exists, capacity

Getting started

1. Copy environment example and set values:

```
cp .env.example .env
# then edit .env to set SF secrets and JWT_SECRET
```

2. Install dependencies:

```
npm run install-all
```

3. Setup Salesforce

   This application connects to a Salesforce Org to manage data.

   **Create a Free Salesforce Developer Edition Account**
   
   If you don't have a Salesforce account yet, follow these steps:
   
   1. Go to [https://developer.salesforce.com/signup](https://developer.salesforce.com/signup)
   2. Fill out the registration form:
      - **First Name** and **Last Name**
      - **Email** (use a valid email - you'll need to verify it)
      - **Role**: Select "Developer"
      - **Company**: Can be your name or organization
      - **Country**: Select your country
      - **Postal Code**: Your postal/zip code
      - Check the box to agree to the Master Subscription Agreement
   3. Click **Sign me up**
   4. Check your email for the verification link from Salesforce
   5. Click the verification link and set your password
   6. You'll be redirected to your new Salesforce Developer Org
   7. **Save your credentials** - you'll need them for authentication
   
   **Important Notes:**
   - Developer Edition accounts are **completely free** forever
   - They never expire as long as you log in at least once every 6 months
   - Each Developer Edition org is a separate environment (perfect for testing)
   - You can create multiple Developer Edition accounts if needed
   - Your username will be your email address

   **Salesforce CLI (Recommended)**
   This is the easiest method and bypasses "SOAP API Login" restrictions.
   1. Install [Salesforce CLI](https://developer.salesforce.com/tools/salesforcecli).
   2. Authorize your Org:
      ```bash
      sf org login web --alias dev-org --set-default
      ```
      This will open a browser window - log in with your Developer Edition credentials.
   3. Verify the application can connect:
      ```bash
      node scripts/verify-app-auth.js
      ```

4. Enable Salesforce Digital Experiences (for Public API Access)

   To allow the login endpoint to work without authentication, you need to create a Salesforce Site with guest user access:

   **Step 1: Enable Digital Experiences**
   1. In Salesforce Setup, search for **"Digital Experiences"** in Quick Find
   2. Click **Digital Experiences → Settings**
   3. Check the box for **"Enable Digital Experiences"**
   4. Accept the default domain name (e.g., `orgfarm-{yourid}-dev-ed.develop.my.site.com`)
   5. Click **Save**

   **Step 2: Create a New Site**
   1. Go to **Digital Experiences → All Sites**
   2. Click **New** button
   3. Select template: **Build Your Own (LWR)**
   4. Enter Site Name: **Volunteer API**
   5. Enter URL: **volunteerapi**
   6. Click **Create** (this may take a few minutes)

   **Step 3: Enable Guest User API Access**
   
   **IMPORTANT:** This step is crucial for allowing your mobile application (external to Salesforce) to call the login endpoint without authentication.
   
   1. Once the site is created, click the dropdown next to your site and select **Administration**
   2. In the left sidebar, click **Preferences**
   3. You'll see a "General" section with a checkbox: **"Allow guest users to access public APIs"**
   4. **Check this box** and click **Save**
   
   **Step 4: Grant Guest User Profile Access to Apex Classes**
   
   **CRITICAL:** Without this step, the site will show a login page instead of executing your API code.
   
   Now you need to give the guest user permission to execute the authentication Apex classes:
   
   1. In Salesforce Setup (not the site admin), search for **"Profiles"** in Quick Find
      
      **Quick Command (from volunteer-registration folder):**
      ```powershell
      sf org open --path /lightning/setup/EnhancedProfiles/home
      ```
      
      **Or manually:** In Salesforce Setup, use the Quick Find box on the left and type "Profiles"
   
   2. In the list of profiles, look for a profile named **"Volunteer API Profile"** or **"Volunteer API Site Guest User"**
      - **Note:** Do NOT click on "Volunteer API" workspace/site links - you need the guest user **profile** in the profiles list
      - Look in the table/list of profile names (System Administrator, Standard User, etc.)
   3. Click on that **profile name** (this opens profile settings, NOT the site)
   4. Scroll down to **Enabled Apex Class Access** section
   5. Click **Edit**
   6. Move these classes from "Available Apex Classes" to "Enabled Apex Classes":
      - `AuthAPI`
      - `ValidationUtils`
      - `PasswordUtils`
      - `JWTUtils`
      - `PublicLoginController` (NEW - required for Visualforce API)
   7. Click **Save**
   8. Scroll down to **Enabled Visualforce Page Access** section
   9. Click **Edit**
   10. Move `PublicLoginAPI` from "Available" to "Enabled"
   11. Click **Save**
   
   **Important:** The login page you're seeing when testing the API is NOT for your application users - it's Salesforce blocking API access because the guest user profile doesn't have permission to execute the Apex classes. Once you enable these classes, the API will return JSON instead of a login page.

   **Step 5: Activate the Site**
   
   **CRITICAL:** The site must be activated for public API access to work!
   
   1. Go back to **Digital Experiences → All Sites**
   2. Click **Activate** next to your "Volunteer API" site
   3. Confirm activation
   4. Copy the site URL from the list (e.g., `https://orgfarm-{yourid}-dev-ed.develop.my.site.com/volunteerapi`)
   
   **Note:** The site status should show "Active" after this step.

   **Your Public API Endpoints for External Mobile Apps:**
   
   Once configured, your **mobile application** (or any external client) can authenticate without needing a Salesforce session:
   
   **1. Login (No Auth Required):**
   ```
   POST https://orgfarm-{yourid}-dev-ed.develop.my.site.com/volunteerapi/services/apexrest/api/auth/login
   
   Headers:
   Content-Type: application/json
   
   Body (JSON):
   {
     "email": "someemail@gmail.com",
     "password": "admin123"
   }
   
   Response:
   {
     "token": "eyJhbGci...",
     "volunteer": {
       "id": "a2Tfj000001us1xEAA",
       "Email__c": "someemail@gmail.com",
       "First_Name__c": "Administrator",
       "Last_Name__c": "COHAP",
       "Status__c": "Active"
     }
   }
   ```
   
   This endpoint works **WITHOUT any Salesforce authentication token**! Perfect for mobile apps.
   
   **2. Protected Endpoints (Require JWT from Login):**
   
   After login, use the JWT token for all other API calls:
   ```
   GET https://orgfarm-{yourid}-dev-ed.develop.my.salesforce.com/services/apexrest/api/volunteers
   
   Headers:
   Authorization: Bearer <JWT_TOKEN_FROM_LOGIN>
   Content-Type: application/json
   ```
   
   Available endpoints:
   - `/api/volunteers` - Volunteer CRUD operations
   - `/api/events` - Event management
   - `/api/registrations` - Event registrations
   - `/api/volunteerhours` - Hours tracking and approval
   
   **Why This Architecture?**
   - ✅ Mobile app doesn't need Salesforce credentials
   - ✅ Login endpoint is publicly accessible via Site guest user
   - ✅ JWT tokens secure all other endpoints
   - ✅ Everything hosted in Salesforce (no external servers needed)
   - ✅ Automatic token expiration (12 hours) for security
   
   **🚨 Troubleshooting: If you see a Salesforce login page instead of JSON response:**
   
   This means the guest user profile doesn't have permission to execute the Apex classes. The login page is NOT for your app users - it's Salesforce blocking API access.
   
   **Fix:**
   1. Run: `sf org open --path /lightning/setup/EnhancedProfiles/home`
   2. Find the "Volunteer API Profile" (or similar guest user profile)
   3. Enable the 4 required Apex classes: `AuthAPI`, `JWTUtils`, `PasswordUtils`, `ValidationUtils`
   4. Test again - you should get JSON, not a login page
   
   **Can't find the profile?** Run this query to find it:
   ```powershell
   sf data query --query "SELECT Id, Name FROM Profile WHERE Name LIKE '%Volunteer%' OR Name LIKE '%Site%' OR Name LIKE '%Guest%'" --json
   ```
   
   **Note:** Your `.env` file's `SF_USERNAME` and `SF_PASSWORD` are for Salesforce CLI authentication only, NOT for the site login page. The mobile app uses volunteer emails/passwords stored in the `Volunteer__c` object.

5. Init database with dummy data:

```
npm run init-db
```

   **⚠️ Known Issue:** Due to limitations with jsforce metadata API, some fields may not be created properly despite showing success. If seeding fails with "No such column" errors:
   
   1. Check if objects/fields exist in Salesforce Setup → Object Manager
   2. If fields are missing, you may need to create them manually via the Salesforce UI
   3. Then run the seed script: `node database/init/runSeed.js`
   
   Alternatively, wait 5-10 minutes for metadata propagation and retry the seed.

   **Verify Objects Were Created:**
   After running `init-db`, check your Salesforce Org to confirm the custom objects were created:
   
   1. Log into your Salesforce Org
   2. Click the **⚙️ gear icon** (top right) → **Setup**
   3. In the Quick Find box, type **"Object Manager"**
   4. Look for these custom objects:
      - `Volunteer` (API: `Volunteer__c`)
      - `Event` (API: `Event__c`)
      - `Registration` (API: `Registration__c`)
      - `Volunteer Hours` (API: `VolunteerHours__c`)
      - `History` (API: `History__c`)
   
   *Alternatively, use the **App Launcher** (9 dots icon) and search for "Volunteers" or "Events" to view the data.*

API overview

```
npm run start-api
```

[Join Postman to see API Endpoint Documentation](https://app.getpostman.com/join-team?invite_code=f21d75ffcf9cbd4031b45de86f528aa3260a856a28ed8044f48f02670bb23174&target_code=2d6392d64d8abbbf1fd3d8a08b163a40)

[Mock Server Endpoint](https://f1fc3834-5ac4-4daa-87bf-ae43602eb472.mock.pstmn.io)

Get session JWT Token
{{baseUrl}}/auth/login


Sex Ofender Registry Background Check
curl --request GET 
	--url 'https://sex-offenders.p.rapidapi.com/sexoffender?firstName=Joseph&lastName=Nigro&zipcode=10465&mode=extensive' 
	--header 'x-rapidapi-host: sex-offenders.p.rapidapi.com' 
	--header 'x-rapidapi-key: <key>'
