# Volunteer Management App - Salesforce Database Setup

**ONE COMMAND SETUP:** `node init/initDB.js`

This directory contains all Salesforce-related code for the volunteer management application.

## Quick Start (Recommended)

```bash
# From the database/ directory
node init/initDB.js
```

This single command will:
1. ✅ Authenticate with Salesforce
2. ✅ Generate all metadata (objects, fields, tabs, app, profile with permissions)
3. ✅ Clean up existing data
4. ✅ Deploy everything to Salesforce
5. ✅ Seed initial data
6. ✅ Validate the setup

## Prerequisites

1. **Salesforce CLI** installed: `npm install -g @salesforce/cli`
2. **Authenticate** (one-time): `sf org login web --alias dev-org`
3. **Node dependencies**: `npm install` (from project root)
4. **Environment variables** (Azure App Settings or local `.env`) - initDB.js reads from `process.env`

## Directory Structure

```
database/
├── .sf/                    # Salesforce CLI authentication cache
│   └── config.json         # SF CLI org configuration
├── .sfdx/                  # Salesforce DX cache and local config
│   ├── sfdx-config.json    # Local SFDX settings
│   └── sfdx-project.json   # Backup copy
├── config/                 # Database configuration
│   └── salesForceConfig.js # Salesforce authentication logic
├── deploy-scripts/         # Deployment automation scripts
│   ├── generate-sfdx-metadata.js  # Converts schemas to SFDX XML format
│   ├── deploy-incremental.js      # Incremental deployment (batch approach)
│   ├── deploy-sfdx-metadata.js    # Full deployment wrapper
│   └── wait-for-fields.js         # Field propagation monitor
├── force-app/              # SFDX source format metadata
│   └── default/
│       └── objects/        # Custom object definitions
│           ├── Volunteer__c/
│           ├── Event__c/
│           ├── Registration__c/
│           ├── VolunteerHours__c/
│           └── History__c/
├── init/                   # Database initialization scripts
│   ├── initDB.js           # Main orchestrator (delete→deploy→validate→seed)
│   ├── runSeed.js          # Seed data insertion
│   ├── seedData.js         # Seed data definitions
│   └── [legacy scripts]    # Older approaches (kept for reference)
├── schemas/                # JavaScript schema definitions
│   ├── Volunteer.js        # Volunteer object field definitions
│   ├── Event.js            # Event object field definitions
│   ├── Registration.js     # Registration object field definitions
│   ├── VolunteerHours.js   # Volunteer Hours object field definitions
│   └── History.js          # History object field definitions
└── sfdx-project.json       # SFDX project configuration (required at root)
```

## Key Files

### sfdx-project.json
**Locations**: 
- `database/sfdx-project.json` (minimal file - required by SF CLI at project root)
- `database/.sfdx/sfdx-project.json` (managed by scripts - authoritative copy)

The SF CLI requires `sfdx-project.json` at the project root directory. We maintain:
1. A **minimal version** at `database/sfdx-project.json` for SF CLI compatibility
2. The **authoritative version** at `database/.sfdx/sfdx-project.json` managed by `generate-sfdx-metadata.js`

Both files must exist and should have identical content defining:
- Source structure (`force-app/`)
- API version (59.0)

### Configuration Flow

1. **Schema Definitions** (`schemas/*.js`)
   - Define field structures in JavaScript
   - Exported as arrays of field objects

2. **Metadata Generation** (`deploy-scripts/generate-sfdx-metadata.js`)
   - Reads schemas from `../schemas/`
   - Generates XML files in `../force-app/default/objects/`
   - Creates/validates `sfdx-project.json`

3. **Deployment** (`init/initDB.js`)
   - Runs SF CLI commands from database directory
   - Uses `force-app/` for source metadata
   - References `.sf/` for authentication

## Path References

All scripts use paths relative to their location:

- **initDB.js** runs commands from:
  - SF CLI commands: `database/` (has .sf, .sfdx, sfdx-project.json)
  - Node scripts: `project-root/` (for accessing deploy-scripts)

- **generate-sfdx-metadata.js** references:
  - Input: `../schemas/` (relative to deploy-scripts/)
  - Output: `../force-app/` (relative to deploy-scripts/)
  - Config: `../sfdx-project.json` (database root)

## Usage

Initialize and seed the database:
```bash
cd volunteer-management-app
node database/init/initDB.js
```

The script will:
1. Authenticate with Salesforce
2. Delete existing objects (if any)
3. Deploy metadata (objects + fields)
4. Validate field propagation
5. Seed sample data
6. Validate seeded records

## Important Notes

- SF CLI commands must run from `database/` directory (where `.sf/`, `.sfdx/`, and `sfdx-project.json` are located)
- Salesforce Developer Edition orgs can have 5-60 minute delays for field propagation
- The `initDB.js` script includes validation and retry logic to handle these delays
