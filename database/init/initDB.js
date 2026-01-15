const path = require('path');
const { spawnSync } = require('child_process');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

// This init script now runs the orchestration script that applies metadata,
// waits for propagation, seeds, and optionally recreates the metadata if needed.
// Always use Salesforce for init (no need to set USE_SALESFORCE anymore).
const useSalesforce = true;
const sfConfig = require('../config/salesForceConfig');
const jsforce = require('jsforce');

async function initializeDB() {
  // USE_SALESFORCE gate removed — this init uses Salesforce by default.

  try {
    // Ensure auth/log in (will populate SF_ACCESS_TOKEN and SF_INSTANCE_URL when using username/password)
    const params = await sfConfig.ensureAuthAndLogin();
    console.log('Salesforce auth ready (mode):', params.authMode);
  } catch (err) {
    console.error('❌ Salesforce auth/login failed:', err && err.message ? err.message : err);
    process.exit(1);
  }

  // After login, check if our custom objects already exist. If they do,
  // perform a destructive recreate (delete+create) and then seed. Otherwise
  // run the regular orchestrator which applies and seeds (and may recreate on failure).
  const conn = new jsforce.Connection({ instanceUrl: process.env.SF_INSTANCE_URL, accessToken: process.env.SF_ACCESS_TOKEN });
  const objectsToCheck = ['Event__c', 'Volunteer__c', 'Registration__c', 'VolunteerHours__c', 'History__c'];
  let anyExist = false;
  try {
    for (const name of objectsToCheck) {
      try {
        const existing = await conn.metadata.read('CustomObject', name).catch(() => null);
        if (existing && existing.fullName) {
          console.log(`Found existing CustomObject: ${name}`);
          anyExist = true;
          break;
        }
      } catch (e) {
        // ignore and continue
      }
    }
  } catch (e) {
    console.warn('Warning: failed to check existing metadata, proceeding with orchestrator:', e && e.message ? e.message : e);
  }

  if (anyExist) {
    console.log('Existing Salesforce objects detected — performing destructive recreate then seeding.');
    const recreate = path.resolve(__dirname, 'recreateMetadata.js');
    const seedRunner = path.resolve(__dirname, 'runSeed.js');

    // Run destructive recreate (requires --confirm)
    const recRes = spawnSync('node', [recreate, '--confirm'], { stdio: 'inherit', shell: true, env: { ...process.env, USE_SALESFORCE: '1' } });
    if (recRes.status !== 0) {
      console.error('Destructive recreate failed. Aborting.');
      process.exit(recRes.status || 1);
    }

    // Wait for propagation
    console.log('Waiting 60 seconds for metadata propagation after recreate...');
    await new Promise(r => setTimeout(r, 60 * 1000));

    // Run seed runner
    const seedRes = spawnSync('node', [seedRunner], { stdio: 'inherit', shell: true, env: { ...process.env, USE_SALESFORCE: '1' } });
    process.exit(seedRes.status === 0 ? 0 : (seedRes.status || 1));
  }

  // No existing objects found — run the regular orchestrator
  const orchestration = path.resolve(__dirname, 'applyAndSeed.js');
  console.log('No existing Salesforce objects detected. Running orchestrator:', orchestration);
  const res = spawnSync('node', [orchestration], { stdio: 'inherit', shell: true, env: { ...process.env, USE_SALESFORCE: '1' } });
  process.exit(res.status === 0 ? 0 : (res.status || 1));
}

// Run initialization if this script is run directly
if (require.main === module) {
  initializeDB();
}

module.exports = initializeDB;
