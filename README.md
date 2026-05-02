# Volunteer Management API

This repository contains a simple REST API built with Node.js, Express, and Salesforce (sfdx) for managing Volunteers, Events, and Registrations (shift sign-ups).

Features
- User registration and login (username/password) with JWT-based authentication
- CRUD for Events and Volunteers
- Create / Cancel Registrations with checks: event active, shift exists, capacity

Getting started

1. Configure environment variables (Azure App Settings or local `.env` for development):

```
cp .env.example .env
# then edit .env to set SF secrets and JWT_SECRET
```

   In Azure App Service, set the same keys in **Configuration → Application settings** instead of creating a `.env` file.

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

4. Init database with dummy data:

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
