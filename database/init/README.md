# Database Initialization Scripts

This folder contains the core scripts for setting up Salesforce database with **one command**.

## Files Overview

### 🎯 Main Entry Point
- **`initDB.js`** - Complete one-command orchestrator
  - Authenticates with Salesforce
  - Cleans existing app/tabs/profile
  - Deletes existing objects
  - Generates and deploys metadata
  - Deploys page layouts for UI visibility
  - Refreshes metadata cache
  - Seeds test data
  - Validates everything
  - **Usage**: `node database/init/initDB.js`

### 🌱 Seeding Scripts
- **`smartSeed.js`** - Adaptive data seeding script
  - Called automatically by `initDB.js`
  - Creates 2 volunteers with bcrypt-hashed passwords
  - Creates 2 events
  - Creates 2 registrations (linked to volunteers and events)
  - Creates 2 volunteer hours records
  - Can also be run standalone: `node database/init/smartSeed.js`

### 📦 Data Definitions
- **`seedData.js`** - Reference data structure
  - Contains the seed data schema
  - Shows all available fields
  - Used as documentation for data structure
  - **Note**: `smartSeed.js` has data hardcoded, not imported from here

## Quick Start

**One command setup:**
```bash
node database/init/initDB.js
```

This will:
1. ✅ Authenticate with Salesforce using CLI token
2. ✅ Deploy 5 objects (Volunteer, Event, Registration, VolunteerHours, History)
3. ✅ Deploy 74 custom fields with proper permissions
4. ✅ Deploy 5 tabs, 1 app, 1 profile
5. ✅ Configure page layouts so all fields are visible in UI
6. ✅ Seed test data with 2 volunteers, 2 events, etc.
7. ✅ Validate everything is working

**Runtime**: ~70 seconds

## Test Accounts Created

After running `initDB.js`, you'll have these test accounts:

1. **Administrator COHAP**
   - Email: `admin@cohap.org`
   - Password: `admin123` (bcrypt hashed in Pass_Hash__c field)
   - Type: Administrator
   - Status: Active

2. **John Volunteer**
   - Email: `volunteer@cohap.org`
   - Password: `volunteer123` (bcrypt hashed)
   - Type: Individual
   - Status: Active

## Prerequisites

1. **Salesforce CLI** (`sf` command) installed
2. **Authenticated org**: `sf org login web --alias dev-org`
3. **Environment variables** (Azure App Settings or local `.env` file):
   ```
   SF_ACCESS_TOKEN=<token>
   SF_INSTANCE_URL=https://your-instance.salesforce.com
   ```

To get these values:
```bash
sf org display --target-org dev-org --json
```

## Architecture

```
initDB.js (Main Orchestrator)
    │
    ├─→ Calls: generate-sfdx-metadata.js (generates XML)
    │   
    ├─→ Calls: sf CLI commands (deploys metadata)
    │
    ├─→ Creates: Page layouts (inline in step4c)
    │
    └─→ Calls: smartSeed.js (seeds data)
            │
            └─→ Uses: jsforce + REST API (creates records)
```

## Why This Approach?

**Problem**: Salesforce trial orgs expire every 30 days

**Solution**: One-command setup that can recreate entire testing environment in ~70 seconds

**Benefits**:
- ✅ Repeatable - run it every time you create a new trial org
- ✅ Fast - complete setup in about 1 minute
- ✅ Automated - no manual configuration needed
- ✅ Complete - includes objects, fields, permissions, layouts, and test data
- ✅ Validated - confirms everything works before finishing

## Troubleshooting

**Issue**: "Command failed" or deployment errors
- **Solution**: Make sure you're authenticated: `sf org login web --alias dev-org`

**Issue**: Fields not visible in UI
- **Solution**: Page layouts are now deployed automatically. If still not visible, check Salesforce Setup → Object Manager → Volunteer → Page Layouts

**Issue**: Authentication errors
- **Solution**: Update the environment variables (or your local `.env`) with a fresh token from `sf org display --json`

**Issue**: "Field not found" errors during seeding
- **Solution**: Re-run `node database/init/initDB.js` - it includes a 30s metadata refresh wait

## Development Notes

- All metadata is generated dynamically from `database/schemas/*.js`
- Field-level security is set automatically for all custom fields
- Page layouts include all custom fields organized in sections
- Passwords are hashed using bcrypt (salt rounds: 10)
- The script waits 30s after metadata deployment for Salesforce cache refresh
