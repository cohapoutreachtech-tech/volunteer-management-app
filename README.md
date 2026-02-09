# Volunteer Management API

A Salesforce-native REST API for managing Volunteers, Events, and Registrations. Built entirely on Salesforce Apex with **tokenless public API access** via Salesforce Sites.

## Features
- ✅ **Tokenless Authentication** - No token expiration issues via Salesforce Sites
- ✅ **Public API Access** - External applications can authenticate without Salesforce credentials
- ✅ **SHA-256 Password Hashing** - Apex-compatible secure password storage
- ✅ **Comprehensive Validations** - Duplicate prevention, format validation, data integrity checks
- ✅ **Volunteer Management** - CRUD operations with duplicate email prevention
- ✅ **Event Management** - Event creation, tracking, and capacity management
- ✅ **Registration System** - Volunteer event sign-ups with duplicate prevention
- ✅ **Hours Tracking** - Clock in/out with automatic hour calculation
- ✅ **Activity History** - Comprehensive audit trail for all operations

## Architecture

**No Node.js Backend Required** - All APIs run directly on Salesforce Apex:
- **Authentication**: SHA-256 hashed passwords stored in `Volunteer__c` object
- **Public Access**: Salesforce Sites guest user provides tokenless API access
- **Database**: Native Salesforce custom objects (no external database)
- **Deployment**: Salesforce CLI with GitHub Actions CI/CD

## Getting Started

### Prerequisites
- Salesforce Developer Edition account (free forever)
- Salesforce CLI installed
- Node.js (for test scripts only)

### 1. Environment Setup

Copy the environment template:
```bash
cp .env.example .env
```

Edit `.env` with your Salesforce credentials:
```env
# Salesforce Site URL (No authentication token needed!)
SF_SITE_URL=https://your-org.my.site.com/volunteerapivforcesite

# Salesforce Org (for admin operations via CLI)
SF_INSTANCE_URL=https://your-org.salesforce.com
SF_USERNAME=your-email@example.com
SF_PASSWORD=yourPasswordAndSecurityToken
```

### 2. Create Salesforce Developer Edition Account

If you don't have a Salesforce account:
   
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

   
1. Go to [https://developer.salesforce.com/signup](https://developer.salesforce.com/signup)
2. Fill out the registration form (First/Last Name, Email, Role: Developer, Company)
3. Check your email for verification link
4. Set your password
5. **Save your credentials** - you'll need them for CLI authentication

**Important:** Developer Edition accounts are free forever (just login once every 6 months).

### 3. Authenticate with Salesforce CLI

Install [Salesforce CLI](https://developer.salesforce.com/tools/salesforcecli), then authorize your org:

```bash
sf org login web --alias dev-org --set-default
```

This opens a browser - log in with your Developer Edition credentials.

**Verify authentication:**
```bash
cd volunteer-registration
node test/verify-app-auth.js
```

### 4. Deploy Apex Classes and Custom Objects

Deploy all metadata to your Salesforce org:

```bash
cd volunteer-registration
sf project deploy start --source-dir force-app/default --wait 20
```

**Verify deployment:**
```bash
sf org open --path /lightning/setup/ObjectManager/home
```

Look for: `Volunteer__c`, `Event__c`, `Registration__c`, `VolunteerHours__c`, `History__c`

### 5. Configure Salesforce Site (Public API Access)

**The working site already exists in your org!** Just verify it's active:

1. Check site status:
   ```bash
   sf org open --path /lightning/setup/SetupNetworks/home
   ```

2. Look for **"Volunteer API"** site with URL path: `volunteerapivforcesite`

3. If status is "Inactive", click **Activate**

4. Copy the site URL:
   ```
   https://[your-org].develop.my.site.com/volunteerapivforcesite
   ```

5. Update your `.env`:
   ```env
   SF_SITE_URL=https://[your-org].develop.my.site.com/volunteerapivforcesite
   ```

**For detailed site setup** (if you need to create from scratch), see [SALESFORCE_SITES_SETUP.md](SALESFORCE_SITES_SETUP.md).

### 6. Seed Test Data

Initialize database with test data:

```bash
cd database
npm install
npm run seed
```

**Test credentials created:**
- Email: `admin@cohap.org`
- Password: `admin123`

### 7. Test the API

```bash
cd volunteer-registration/test
node test-site-api.js
```

**Expected response:**
```json
{
  "message": "Login successful",
  "volunteer": {
    "Id": "a2T...",
    "Email__c": "admin@cohap.org",
    "First_Name__c": "Administrator"
  },
  "token": "eyJ0eXAi..."
}
```

✅ **Success!** Your API is working without authentication tokens.

---

## API Documentation

### Base URL
```
https://[your-org].develop.my.site.com/volunteerapivforcesite/services/apexrest
```

### Authentication Endpoint (No Token Required)

**POST** `/api/auth/login`

**Request:**
```json
{
  "email": "admin@cohap.org",
  "password": "admin123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "volunteer": {
    "Id": "a2Tfj000001us1xEAA",
    "Email__c": "admin@cohap.org",
    "First_Name__c": "Administrator",
    "Last_Name__c": "COHAP"
  },
  "token": "eyJhbGci..."
}
```

### Protected Endpoints (Require JWT Token)

After login, include the JWT token in all subsequent requests:

```bash
Authorization: Bearer <token-from-login>
```

**Available endpoints:**
- **Volunteers**: `/api/volunteers/*` - CRUD operations
- **Events**: `/api/events/*` - Event management
- **Registrations**: `/api/registrations/*` - Event sign-ups
- **Hours**: `/api/volunteerhours/*` - Hours tracking

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete endpoint reference.

---

## Data Validations

All Apex APIs include comprehensive validations:

### ✅ Duplicate Prevention
- **Email Uniqueness**: No duplicate volunteer emails (409 Conflict)
- **Registration Uniqueness**: Volunteer can only register once per event (409 Conflict)

### ✅ Format Validation
- **Dates**: YYYY-MM-DD format required
- **Email**: Valid email format
- **Phone**: Valid phone number format
- **URLs**: Valid URL format for image fields

### ✅ Data Integrity
- **Required Fields**: All mandatory fields validated
- **Numeric Values**: Type checking for numbers
- **Record Existence**: 404 if related records don't exist
- **Foreign Key Validation**: Verify volunteer/event exists before creating registration/hours

See [APEX_VALIDATIONS.md](APEX_VALIDATIONS.md) for complete validation reference.

---

## Password Security

**SHA-256 Hashing**: Passwords are hashed using SHA-256 (Apex-compatible):

```apex
// Apex (PasswordUtils.cls)
String hash = EncodingUtil.convertToHex(
  Crypto.generateDigest('SHA-256', Blob.valueOf(password + salt))
);
```

```javascript
// Node.js (seedData.js)
const hash = crypto.createHash('sha256')
  .update(password + salt)
  .digest('hex');
```

**Why SHA-256?** Salesforce Apex doesn't support bcrypt natively. SHA-256 provides Apex compatibility with adequate security when combined with:
- Long random salts (32 characters)
- Account lockout policies
- Rate limiting on login attempts

---

## Deployment

### Manual Deployment
```bash
cd volunteer-registration
sf project deploy start --source-dir force-app/default --wait 20
```

### CI/CD with GitHub Actions

Automated deployment on push to `dev` branch. See [DEPLOYMENT.md](DEPLOYMENT.md) for setup instructions.

**Required GitHub Secrets:**
- `SFDX_AUTH_URL` - Salesforce auth URL
- `SF_USERNAME` - Admin username
- `SF_PASSWORD` - Admin password

---

## Why Salesforce Sites?

**Problem:** Salesforce access tokens expire every 12-24 hours, requiring constant refresh logic.

**Solution:** Salesforce Sites provides permanent public API access through a guest user profile.

### Benefits
- ✅ **No Token Expiration** - Guest user doesn't need authentication tokens
- ✅ **Production Ready** - Standard Salesforce pattern for public APIs
- ✅ **Secure** - Guest user has minimal, controlled permissions
- ✅ **Scalable** - Salesforce handles all infrastructure and scaling
- ✅ **No External Server** - Everything runs on Salesforce platform

### Security Model
- Guest user can only access explicitly enabled Apex classes
- Object/field-level security enforced via profile permissions
- All Apex validation logic still applies
- Monitor guest activity in Setup → Session Management

---

## Project Structure

```
volunteer-management-app/
├── volunteer-registration/
│   ├── force-app/default/         # Salesforce metadata
│   │   ├── classes/               # Apex REST APIs
│   │   │   ├── AuthAPI.cls        # Login endpoint
│   │   │   ├── VolunteerAPI.cls   # Volunteer CRUD
│   │   │   ├── EventAPI.cls       # Event CRUD
│   │   │   ├── RegistrationAPI.cls # Registration CRUD
│   │   │   ├── VolunteerHoursAPI.cls # Hours tracking
│   │   │   ├── ValidationUtils.cls # Shared validations
│   │   │   └── PasswordUtils.cls  # SHA-256 hashing
│   │   ├── objects/               # Custom objects
│   │   │   ├── Volunteer__c/
│   │   │   ├── Event__c/
│   │   │   ├── Registration__c/
│   │   │   ├── VolunteerHours__c/
│   │   │   └── History__c/
│   │   └── sites/                 # Salesforce Site config
│   │       └── Volunteer_API.site-meta.xml
│   └── test/                      # Test scripts
│       ├── test-site-api.js       # API endpoint tests
│       └── cleanup-all.js         # Delete test data
├── database/
│   └── init/
│       └── seedData.js            # Seed test data (SHA-256)
├── .github/workflows/
│   ├── deploy-salesforce.yml      # CI/CD deployment
│   └── salesforce-pr-validation.yml # PR validation
├── SALESFORCE_SITES_SETUP.md      # Site setup guide
├── APEX_VALIDATIONS.md            # Validation documentation
├── DEPLOYMENT.md                  # CI/CD setup guide
└── README.md                      # This file
```

---

## Troubleshooting

### "Insufficient Privileges" Error
**Cause:** Guest user profile doesn't have Apex class access.

**Fix:**
1. Go to Setup → Sites → Your Site → Public Access Settings
2. Enabled Apex Class Access → Edit
3. Move all API classes to "Enabled" list
4. Save

### "No such column" Error
**Cause:** Custom fields not deployed.

**Fix:**
```bash
sf project deploy start --source-dir force-app/default/objects --wait 20
```

### Site Returns Login Page Instead of JSON
**Cause:** Site is inactive or guest user lacks permissions.

**Fix:**
1. Verify site is Active: Setup → Sites
2. Check Public Access Settings → Enabled Apex Classes
3. Verify object permissions for guest user

### Token Expiration Issues
**You shouldn't have token expiration issues!** The Site API doesn't use tokens.

If you're using `SF_ACCESS_TOKEN` for testing, that's for admin CLI operations only. Use `SF_SITE_URL` for API calls.

---

## Additional Resources

- [Salesforce Sites Documentation](https://help.salesforce.com/articleView?id=sf.sites_overview.htm)
- [Apex REST API Guide](https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_rest.htm)
- [SFDX CLI Reference](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/)

---

## Contributing

1. Create a feature branch
2. Make your changes
3. Test locally with `node test/test-site-api.js`
4. Create pull request (CI/CD will validate)
5. Merge to `dev` (auto-deploys to Salesforce)

---

## License

MIT License - See LICENSE file for details

---

## Support

For issues or questions:
1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Review Salesforce debug logs: Setup → Debug Logs
3. Open GitHub issue with error details
