# Salesforce Sites Setup Guide
**Tokenless Public API Access for External Applications**

## Overview

Salesforce Sites enables your Apex REST APIs to be publicly accessible **without authentication tokens that expire**. This is the standard Salesforce pattern for public-facing APIs.

**Problem Solved:** Salesforce access tokens expire every 12-24 hours, requiring constant refresh logic in production applications.

**Solution:** Salesforce Sites guest user provides permanent API access without tokens.

## Working Configuration

**Your org already has a working site!**

- **Site Name**: Volunteer API
- **URL Path**: `volunteerapivforcesite`
- **Full URL**: `https://[your-org].develop.my.site.com/volunteerapivforcesite`
- **Site Type**: ChatterNetwork (Experience Cloud)
- **Status**: Active ✅

### Quick Verification

```bash
# Open Sites setup
sf org open --path /lightning/setup/SetupNetworks/home

# Look for "Volunteer API" with urlPathPrefix "volunteerapivforcesite"
# Status should be "Active"
```

### Test the Site

```bash
# Update .env with your site URL
SF_SITE_URL=https://[your-org].develop.my.site.com/volunteerapivforcesite

# Test login endpoint (no token needed!)
cd volunteer-registration/test
node test-site-api.js
```

**Expected Response:**
```json
{
  "message": "Login successful",
  "volunteer": {
    "Id": "a2T...",
    "Email__c": "admin@cohap.org"
  },
  "token": "eyJ0eXAi..."
}
```

---

## Prerequisites

- Salesforce Developer Edition org (free forever)
- Admin access to Salesforce Setup
- Salesforce CLI installed and authenticated

---

## Quick Start (If Site Already Exists)

If you deployed the metadata from this repo, the site is already configured:

1. **Verify Site is Active:**
   ```bash
   sf org open --path /lightning/setup/SetupNetworks/home
   ```
   Look for "Volunteer API" - status should be "Active"

2. **Get Your Site URL:**
   - Copy the URL shown (e.g., `https://orgfarm-abc123-dev-ed.develop.my.site.com/volunteerapivforcesite`)
   - Update `.env` file:
     ```env
     SF_SITE_URL=https://your-org.develop.my.site.com/volunteerapivforcesite
     ```

3. **Test API:**
   ```bash
   cd volunteer-registration/test
   node test-site-api.js
   ```

✅ **Done!** Your API is accessible without tokens.

---

## Full Setup (From Scratch)

Follow these steps if you need to create a new site from scratch.


### Step 1: Enable Salesforce Digital Experiences

1. Login to Salesforce: https://login.salesforce.com
2. Go to **Setup** (gear icon top right)
3. In Quick Find, search: **Digital Experiences**
4. Click **Digital Experiences → Settings**
5. Check **"Enable Digital Experiences"**
6. Register a domain:
   - Choose a subdomain (e.g., `your-org-name`)
   - Example: `your-org-name-dev-ed.develop.my.site.com`
   - Click **Check Availability**
   - Click **Register My Salesforce Site Domain**
7. Wait 2-5 minutes for domain activation

### Step 2: Create a New Site

**Option A: Deploy from Metadata (Recommended)**

```bash
# Deploy the site configuration from this repo
cd volunteer-registration
sf project deploy start --metadata CustomSite:Volunteer_API --wait 10
```

**Option B: Create Manually**

1. Go to **Setup → Sites**
2. Click **New**
3. Select template: **Build Your Own** or **Customer Service**
4. Fill in the form:
   ```
   Site Label: Volunteer API
   Site Name: Volunteer_API
   URL Path Prefix: volunteerapivforcesite
   Description: Public API for volunteer management
   ```
5. Click **Create** (takes 2-5 minutes)
6. Click **Activate** when creation completes



### Step 3: Configure Guest User Permissions

The guest user profile controls what anonymous users can access.

#### Quick Command:
```bash
# Open the site's Public Access Settings
sf org open --path /lightning/setup/SetupNetworks/home
# Click on your site → Workspaces → Administration → Preferences
```

#### Enable Apex Classes:

1. In site administration, go to **Settings → Guest User Profile**
2. Or: **Setup → Profiles → [Your Site] Profile**
3. Scroll to **Enabled Apex Class Access**
4. Click **Edit**
5. Move these classes from "Available" to "Enabled":
   ```
   AuthAPI
   VolunteerAPI
   EventAPI
   RegistrationAPI
   VolunteerHoursAPI
   ValidationUtils
   PasswordUtils
   JWTUtils
   ```
6. Click **Save**

**Critical:** Without this, the site returns a login page instead of JSON responses.

#### Enable Custom Object Access:

1. In the same profile, scroll to **Custom Object Permissions**
2. Click **Edit**
3. Enable these permissions:

   | Object | Read | Create | Edit | Delete |
   |--------|------|--------|------|--------|
   | Volunteer__c | ✅ | ✅ | ✅ | ❌ |
   | Event__c | ✅ | ✅ | ✅ | ❌ |
   | Registration__c | ✅ | ✅ | ✅ | ❌ |
   | VolunteerHours__c | ✅ | ✅ | ✅ | ❌ |
   | History__c | ✅ | ✅ | ❌ | ❌ |

4. Click **Save**

#### Enable Field-Level Security:

1. Still in the profile, find each custom object section
2. Click **Edit** next to the object name
3. For each field used in your APIs, set **Visible** = checked
4. Important fields to enable:
   - **Volunteer__c**: All fields (Email__c, Pass_Hash__c, First_Name__c, etc.)
   - **Event__c**: All fields
   - **Registration__c**: All fields
   - **VolunteerHours__c**: All fields
5. Click **Save** after each object

**Tip:** Enable all fields to avoid "insufficient privileges" errors.



### Step 4: Configure CORS (For Browser Access)

If your frontend runs in a browser, enable CORS:

1. Go to **Setup → CORS**
2. Click **New**
3. Add allowed origins:
   ```
   http://localhost:3000
   https://localhost:3000
   http://localhost:4000
   https://your-production-domain.com
   ```
4. Click **Save**

**Note:** Server-to-server API calls don't need CORS configuration.

### Step 5: Verify Site Metadata

Check that the site configuration matches the working setup:

```bash
# Retrieve current site metadata
cd volunteer-registration
sf project retrieve start --metadata CustomSite:Volunteer_API --target-org dev-org

# Check the configuration
cat force-app/default/sites/Volunteer_API.site-meta.xml
```

**Key configuration values:**
```xml
<siteType>ChatterNetwork</siteType>
<urlPathPrefix>volunteerapivforcesite</urlPathPrefix>
<active>true</active>
<siteAdmin>your-email@example.com</siteAdmin>
<siteGuestRecordDefaultOwner>your-email@example.com</siteGuestRecordDefaultOwner>
```

---

## Testing Your Public API



### Update Environment Configuration

Edit your `.env` file:
```env
# Salesforce Site URL (No authentication token needed!)
SF_SITE_URL=https://your-org.develop.my.site.com/volunteerapivforcesite

# Replace "your-org" with your actual org subdomain
# Example: https://orgfarm-abc123-dev-ed.develop.my.site.com/volunteerapivforcesite
```

### Test Login Endpoint

```bash
# Using curl (no Authorization header!)
curl -X POST "https://your-org.develop.my.site.com/volunteerapivforcesite/services/apexrest/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cohap.org","password":"admin123"}'
```

**Expected Response:**
```json
{
  "message": "Login successful",
  "volunteer": {
    "Id": "a2Tfj000001us1xEAA",
    "Email__c": "admin@cohap.org",
    "First_Name__c": "Administrator",
    "Last_Name__c": "COHAP",
    "Status__c": "Active"
  },
  "token": "eyJhbGci..."
}
```

### Run Test Script

```bash
cd volunteer-registration/test
node test-site-api.js
```

**What it tests:**
- ✅ Login endpoint (POST /api/auth/login)
- ✅ JWT token generation
- ✅ Password verification (SHA-256)
- ✅ JSON response format

---

## API Endpoints

### Base URL

All API calls use your site URL:
```
https://[your-org].develop.my.site.com/volunteerapivforcesite/services/apexrest
```

### Public Endpoint (No Token Required)

**POST** `/api/auth/login`

Login volunteer and receive JWT token.

**Request:**
```json
{
  "email": "volunteer@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "volunteer": { ... },
  "token": "eyJ..."
}
```

### Protected Endpoints (JWT Required)

After login, include JWT in Authorization header:
```
Authorization: Bearer eyJ...
```



**Available Endpoints:**

**Volunteers** - `/api/volunteers/*`
- GET `/` - List volunteers
- GET `/{id}` - Get volunteer
- POST `/` - Create volunteer
- PUT `/{id}` - Update volunteer

**Events** - `/api/events/*`
- GET `/` - List events
- GET `/{id}` - Get event
- POST `/` - Create event
- PUT `/{id}` - Update event
- DELETE `/{id}` - Delete event

**Registrations** - `/api/registrations/*`
- GET `/` - List registrations
- GET `/{id}` - Get registration
- GET `/volunteer/{id}` - By volunteer
- GET `/event/{id}` - By event
- POST `/` - Create registration
- PUT `/{id}` - Update registration

**Volunteer Hours** - `/api/volunteerhours/*`
- GET `/` - List hours
- GET `/{id}` - Get hours record
- GET `/volunteer/{id}` - By volunteer
- GET `/event/{id}` - By event
- POST `/` - Create hours
- PUT `/{id}` - Update hours

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for detailed request/response examples.

---

## Benefits of Salesforce Sites

### No Token Management

**Traditional approach (with tokens):**
```javascript
// Token expires every 12-24 hours
const token = await getAccessToken();
// Need refresh logic, error handling, retry mechanisms
```

**Salesforce Sites approach:**
```javascript
// No token needed - just call the API
const response = await fetch(`${SF_SITE_URL}/services/apexrest/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
```

### Production Benefits

✅ **No Token Expiration** - Guest user provides permanent access
✅ **No Token Refresh Logic** - Eliminates complex refresh mechanisms
✅ **Production Ready** - Standard Salesforce pattern for public APIs
✅ **Scalable** - Salesforce handles infrastructure automatically
✅ **Secure** - Guest user has minimal, controlled permissions
✅ **Cost Effective** - Included with Developer Edition (free)
✅ **No External Server** - Eliminate Node.js/Express backend costs

---

## Security Considerations

### Guest User Permissions

The guest user profile is highly restricted:

- ✅ Can only access explicitly enabled Apex classes
- ✅ Can only read/write explicitly enabled objects and fields
- ✅ All Apex validation logic still applies
- ✅ Cannot access Setup or admin features
- ✅ Cannot see other users' data (unless shared)

### Additional Security Measures

**Rate Limiting:**
1. Go to **Setup → Sites → Your Site**
2. Configure request limits per hour/day
3. Set bandwidth limits

**IP Restrictions (Optional):**
1. Go to **Setup → Network Access**
2. Add trusted IP ranges
3. Guest user can only access from these IPs

**Session Monitoring:**
1. Go to **Setup → Session Management**
2. Review guest user sessions
3. Set session timeout policies

**Field-Level Security:**
- Only expose fields needed by the API
- Keep sensitive fields (e.g., Pass_Hash__c) hidden from list views
- Use validation rules for additional data constraints

### Password Security

**SHA-256 with Salts:**
- 32-character random salts per password
- Salt + password hashed together
- Hash stored as `salt:hash` in Pass_Hash__c field

**Best Practices:**
- Enforce strong password policies
- Implement account lockout after failed attempts
- Consider adding CAPTCHA for login endpoint
- Monitor for brute force attempts

---

## Troubleshooting

### Site Returns HTML Login Page Instead of JSON

**Symptom:** API returns Salesforce login page HTML instead of JSON response.

**Cause:** Guest user profile doesn't have Apex class access.

**Fix:**
1. Setup → Sites → Your Site → Public Access Settings
2. Enabled Apex Class Access → Edit
3. Enable all API classes (AuthAPI, VolunteerAPI, etc.)
4. Save and retry

**Verify:**
```bash
curl -X POST "$SF_SITE_URL/services/apexrest/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cohap.org","password":"admin123"}'
```

### "Insufficient Privileges" Error

**Symptom:** API returns 403 Forbidden or "Insufficient privileges" message.

**Cause:** Guest user lacks object or field permissions.

**Fix:**
1. Setup → Profiles → [Site] Profile
2. Custom Object Permissions → Edit
3. Enable Read/Create/Edit for Volunteer__c, Event__c, etc.
4. Enable field-level security for all used fields
5. Save and retry

### "CORS Error" in Browser

**Symptom:** Browser console shows CORS policy error.

**Cause:** Your domain not allowed in CORS configuration.

**Fix:**
1. Setup → CORS → New
2. Add your domain: `http://localhost:3000` or `https://your-domain.com`
3. Include both http:// and https:// if needed
4. Save

**Note:** Server-to-server calls don't need CORS.

### "Site Not Found" (404) Error

**Symptom:** API returns 404 or "Site Not Found" error.

**Cause:** Site inactive or URL incorrect.

**Fix:**
1. Verify site is Active: Setup → Sites
2. Check URL matches exactly (case-sensitive):
   ```
   https://[org].develop.my.site.com/volunteerapivforcesite
   ```
3. Verify URL path prefix: `volunteerapivforcesite` (no hyphen!)
4. Wait 5 minutes after activation for DNS propagation

### "No such column" Error

**Symptom:** Apex error: "No such column 'Field__c' on entity 'Object__c'"

**Cause:** Custom fields not deployed.

**Fix:**
```bash
cd volunteer-registration
sf project deploy start --source-dir force-app/default/objects --wait 20
```

### Debug Apex Errors

**Enable Debug Logs:**
```bash
# Open debug logs setup
sf org open --path /lightning/setup/ApexDebugLogs/home
```

**View Recent Logs:**
```bash
# Get last 10 debug logs
sf apex log list --number 10

# Tail logs in real-time
sf apex log tail
```

**Check Specific Log:**
```bash
sf apex log get --log-id <log-id>
```

### Verify Site Configuration

**Check Site Status:**
```bash
sf org open --path /lightning/setup/SetupNetworks/home
```

**Verify Metadata:**
```bash
# Retrieve current site config
sf project retrieve start --metadata CustomSite:Volunteer_API

# View configuration
cat force-app/default/sites/Volunteer_API.site-meta.xml
```

**Expected values:**
- `<active>true</active>`
- `<urlPathPrefix>volunteerapivforcesite</urlPathPrefix>`
- `<siteType>ChatterNetwork</siteType>`

---

## Site Maintenance

### Monitor Guest User Activity

```bash
# Open session management
sf org open --path /lightning/setup/SessionManagement/home
```

Review:
- Active guest sessions
- API call volume
- Peak usage times
- Error rates

### Update Site Configuration

```bash
# Make changes to site metadata locally
# Then deploy updates
cd volunteer-registration
sf project deploy start --metadata CustomSite:Volunteer_API --wait 10
```

### Backup Site Configuration

```bash
# Retrieve current configuration
sf project retrieve start --metadata CustomSite:Volunteer_API

# Commit to version control
git add force-app/default/sites/
git commit -m "Backup site configuration"
```

### Deactivate Site (Emergency)

If you need to quickly disable public access:

1. Setup → Sites → Your Site
2. Click **Edit**
3. Uncheck **Active**
4. Click **Save**

**API will immediately return 404 errors.**

---

## Next Steps

✅ **Site configured and working!**

**Recommended actions:**

1. **Update your application** to use `SF_SITE_URL` instead of token-based auth
2. **Remove token refresh logic** - no longer needed!
3. **Test all API endpoints** with the site URL
4. **Configure rate limiting** for production
5. **Set up monitoring** for guest user activity
6. **Document the site URL** for your team
7. **Configure CORS** if needed for browser access

**Additional documentation:**
- [README.md](README.md) - Complete project guide
- [APEX_VALIDATIONS.md](APEX_VALIDATIONS.md) - Validation reference  
- [DEPLOYMENT.md](DEPLOYMENT.md) - CI/CD setup
- [volunteer-registration/README.md](volunteer-registration/README.md) - API reference

---

## Additional Resources

- [Salesforce Sites Documentation](https://help.salesforce.com/articleView?id=sf.sites_overview.htm)
- [Guest User Security Best Practices](https://help.salesforce.com/articleView?id=sf.networks_guest_user_security.htm)
- [Apex REST API Guide](https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_rest.htm)
- [Experience Cloud Basics](https://trailhead.salesforce.com/content/learn/modules/communities_basics)
