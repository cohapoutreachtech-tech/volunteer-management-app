# Volunteer Registration - Salesforce Apex API

Salesforce-native REST API backend for volunteer management. All APIs run on Salesforce Apex with **tokenless public access** via Salesforce Sites.

## Architecture

- **Platform**: Salesforce Apex (no Node.js server required)
- **Authentication**: SHA-256 password hashing
- **Public Access**: Salesforce Sites guest user (no token expiration)
- **Database**: Native Salesforce custom objects
- **Deployment**: Salesforce CLI + GitHub Actions

## Project Structure

```
volunteer-registration/
├── force-app/default/          # Salesforce metadata
│   ├── classes/                # Apex REST APIs
│   │   ├── AuthAPI.cls         # POST /api/auth/login
│   │   ├── VolunteerAPI.cls    # /api/volunteers/*
│   │   ├── EventAPI.cls        # /api/events/*
│   │   ├── RegistrationAPI.cls # /api/registrations/*
│   │   ├── VolunteerHoursAPI.cls # /api/volunteerhours/*
│   │   ├── ValidationUtils.cls # Shared validation utilities
│   │   ├── PasswordUtils.cls   # SHA-256 password hashing
│   │   └── JWTUtils.cls        # JWT token generation
│   ├── objects/                # Custom Salesforce objects
│   │   ├── Volunteer__c/       # Volunteer data + auth
│   │   ├── Event__c/           # Events
│   │   ├── Registration__c/    # Event sign-ups
│   │   ├── VolunteerHours__c/  # Hours tracking
│   │   └── History__c/         # Activity audit log
│   ├── sites/                  # Salesforce Site configuration
│   │   └── Volunteer_API.site-meta.xml
│   ├── tabs/                   # UI tabs for objects
│   ├── layouts/                # Page layouts
│   └── applications/           # Salesforce app config
└── test/                       # Test scripts (Node.js)
    ├── test-site-api.js        # Test public API
    ├── cleanup-all.js          # Delete test data
    └── diagnose-site.js        # Site diagnostics
```

## Quick Start

### 1. Deploy to Salesforce

```bash
# From volunteer-registration directory
sf project deploy start --source-dir force-app/default --wait 20
```

### 2. Verify Deployment

```bash
# Check custom objects
sf org open --path /lightning/setup/ObjectManager/home

# Check Apex classes
sf org open --path /lightning/setup/ApexClasses/home
```

### 3. Configure Site

```bash
# Open Sites setup
sf org open --path /lightning/setup/SetupNetworks/home
```

Verify "Volunteer API" site is **Active** with URL path: `volunteerapivforcesite`

### 4. Test API

```bash
cd test
node test-site-api.js
```

## API Endpoints

### Base URL
```
https://[your-org].develop.my.site.com/volunteerapivforcesite/services/apexrest
```

### Public Endpoint (No Authentication)

**POST** `/api/auth/login`
- Volunteer authentication
- Returns JWT token for subsequent requests

### Protected Endpoints (JWT Required)

**Volunteers** - `/api/volunteers`
- GET `/` - List all volunteers
- GET `/{id}` - Get volunteer by ID
- POST `/` - Create volunteer
- PUT `/{id}` - Update volunteer

**Events** - `/api/events`
- GET `/` - List all events
- GET `/{id}` - Get event by ID
- POST `/` - Create event
- PUT `/{id}` - Update event
- DELETE `/{id}` - Delete event

**Registrations** - `/api/registrations`
- GET `/` - List all registrations
- GET `/{id}` - Get registration by ID
- GET `/volunteer/{id}` - Registrations by volunteer
- GET `/event/{id}` - Registrations by event
- POST `/` - Create registration
- PUT `/{id}` - Update registration

**Volunteer Hours** - `/api/volunteerhours`
- GET `/` - List all hours
- GET `/{id}` - Get hours by ID
- GET `/volunteer/{id}` - Hours by volunteer
- GET `/event/{id}` - Hours by event
- POST `/` - Create hours entry
- PUT `/{id}` - Update hours

## Data Validations

All APIs include comprehensive validations via `ValidationUtils.cls`:

### Duplicate Prevention
- ✅ Email uniqueness (409 Conflict)
- ✅ Registration uniqueness per volunteer/event (409 Conflict)

### Format Validation
- ✅ Date format: YYYY-MM-DD
- ✅ Email format
- ✅ Phone number format
- ✅ URL format for images

### Data Integrity
- ✅ Required fields validation
- ✅ Numeric type checking
- ✅ Record existence (404 if not found)
- ✅ Foreign key validation

See [APEX_VALIDATIONS.md](../APEX_VALIDATIONS.md) for details.

## Password Security

**SHA-256 Hashing** with salts:

```apex
// PasswordUtils.cls
public static String hashPassword(String password) {
    String salt = generateSalt();
    String saltedPassword = password + salt;
    Blob hash = Crypto.generateDigest('SHA-256', Blob.valueOf(saltedPassword));
    String hashHex = EncodingUtil.convertToHex(hash);
    return salt + ':' + hashHex;
}
```

**Why SHA-256?** Salesforce Apex doesn't support bcrypt. SHA-256 provides compatibility with adequate security when combined with:
- 32-character random salts
- Account lockout policies
- Rate limiting

## Testing

### Test API Access
```bash
cd test
node test-site-api.js
```

### Clean Test Data
```bash
node cleanup-all.js
```

### Diagnose Site Issues
```bash
node diagnose-site.js
```

## Deployment

### Manual Deployment
```bash
sf project deploy start --source-dir force-app/default --wait 20
```

### Deploy Specific Metadata
```bash
# Deploy only Apex classes
sf project deploy start --metadata ApexClass --wait 10

# Deploy only custom objects
sf project deploy start --source-dir force-app/default/objects --wait 10

# Deploy site configuration
sf project deploy start --metadata CustomSite:Volunteer_API --wait 10
```

### CI/CD with GitHub Actions

See [DEPLOYMENT.md](../DEPLOYMENT.md) for automated deployment setup.

## Troubleshooting

### "Insufficient Privileges" Error

**Cause:** Guest user profile lacks Apex class access.

**Fix:**
1. Setup → Sites → Volunteer API → Public Access Settings
2. Enabled Apex Class Access → Edit
3. Enable all API classes
4. Save

### "No such column" Error

**Cause:** Custom fields not deployed.

**Fix:**
```bash
sf project deploy start --source-dir force-app/default/objects --wait 20
```

### Site Returns HTML Instead of JSON

**Cause:** Site inactive or guest user lacks permissions.

**Fix:**
1. Verify site Active: Setup → Sites
2. Check Public Access Settings → Apex classes enabled
3. Verify object/field permissions

### Debug Apex Errors

```bash
# Enable debug logs
sf org open --path /lightning/setup/ApexDebugLogs/home

# Create debug log for guest user
sf apex log get --number 10
```

## Development Workflow

1. **Make changes** to Apex classes locally
2. **Deploy** to Salesforce:
   ```bash
   sf project deploy start --source-dir force-app/default/classes --wait 10
   ```
3. **Test** API endpoints:
   ```bash
   cd test && node test-site-api.js
   ```
4. **Check logs** if errors occur:
   ```bash
   sf apex log tail
   ```
5. **Commit** and push to GitHub
6. **CI/CD** automatically validates and deploys

## Environment Variables

Create `.env` in project root:

```env
# Salesforce Site URL (No authentication token!)
SF_SITE_URL=https://your-org.develop.my.site.com/volunteerapivforcesite

# Salesforce Org (for CLI admin operations)
SF_INSTANCE_URL=https://your-org.salesforce.com
SF_USERNAME=your-email@example.com
SF_PASSWORD=yourPasswordAndSecurityToken
```

**Note:** `SF_SITE_URL` is for API calls (tokenless). `SF_USERNAME`/`SF_PASSWORD` are for CLI admin operations only.

## Additional Resources

- [Parent README](../README.md) - Complete project documentation
- [Salesforce Sites Setup](../SALESFORCE_SITES_SETUP.md) - Detailed site configuration
- [Apex Validations](../APEX_VALIDATIONS.md) - Validation reference
- [Deployment Guide](../DEPLOYMENT.md) - CI/CD setup
- [Salesforce Apex REST Docs](https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_rest.htm)

## Support

- Check [../TROUBLESHOOTING.md](../TROUBLESHOOTING.md)
- Review Salesforce debug logs: `sf apex log tail`
- Open GitHub issue with error details
