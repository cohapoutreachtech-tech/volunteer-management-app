# Volunteer Management API

This repository contains a simple REST API built with Node.js, Express, and MongoDB (Mongoose) for managing Volunteers, Events, and Registrations (shift sign-ups).

Features
- User registration and login (username/password) with JWT-based authentication
- CRUD for Events and Volunteers
- Create / Cancel Registrations with checks: event active, shift exists, capacity

Getting started

1. Copy environment example and set values:

```
cp .env.example .env
# then edit .env to set MONGODB secrets and JWT_SECRET
```

2. Install dependencies:

```
npm run install-all
```

3. Setup Salesforce

   This application connects to a Salesforce Org to manage data.

   **Option A: Salesforce CLI (Recommended)**
   This is the easiest method and bypasses "SOAP API Login" restrictions.
   1. Install [Salesforce CLI](https://developer.salesforce.com/tools/salesforcecli).
   2. Authorize your Org:
      ```bash
      sf org login web --alias dev-org --set-default
      ```
   3. Verify the application can connect:
      ```bash
      node scripts/verify-app-auth.js
      ```

   **Option B: Environment Variables**
   Set the following credential in your `.env` file:
   - `SF_USERNAME`
   - `SF_PASSWORD`
   - `SF_LOGIN_URL` (Defaults to https://login.salesforce.com)
   - `SF_TOKEN` (Security Token, append to password if needed)

   *Note: If your Org blocks SOAP API logins, Option B will fail unless you manually set `SF_ACCESS_TOKEN` and `SF_INSTANCE_URL`.* 

4. Init database with dummy data:

```
npm run init-db
```

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


[Full application repo, after salesforce poc API will live in this repo only](https://github.com/cohapoutreachtech-tech/volunteer-management-website/tree/shreya/frontend-initial)