const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
const jsforce = require('jsforce');
const sfConfig = require('../config/salesForceConfig');
const { volunteers, events, history } = require('./seedData');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function waitForFields(conn, sobjectName, requiredFields = [], timeoutMs = 3 * 60 * 1000, intervalMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const desc = await conn.sobject(sobjectName).describe();
      const names = desc.fields.map(f => f.name);
      const missing = requiredFields.filter(f => !names.includes(f));
      if (missing.length === 0) return true;
      console.log(`Waiting for fields on ${sobjectName}: still missing ${missing.join(', ')} (elapsed ${(Date.now()-start)/1000}s)`);
    } catch (err) {
      console.log('Describe failed, will retry:', err && err.message ? err.message : err);
    }
    await sleep(intervalMs);
  }
  return false;
}

async function createRecords(conn) {
  // Volunteers
  for (const v of volunteers) {
    const payload = { ...v };
    if (payload.name) { payload.Name = payload.name; delete payload.name; }
    if (payload.Pass_Hash) { payload.Pass_Hash__c = payload.Pass_Hash; delete payload.Pass_Hash; }
    // convert Dates to ISO strings (jsforce handles Date objects too, but normalize to be safe)
    for (const k of Object.keys(payload)) {
      if (payload[k] instanceof Date) payload[k] = payload[k].toISOString();
    }
    try {
      const res = await conn.sobject('Volunteer__c').create(payload);
      console.log('Created Volunteer:', res);
    } catch (err) {
      console.error('Error creating Volunteer record:', err && err.message ? err.message : err);
    }
  }

  // Events
  for (const e of events) {
    const payload = { ...e };
    if (payload.name) { payload.Name = payload.name; delete payload.name; }
    for (const k of Object.keys(payload)) {
      if (payload[k] instanceof Date) payload[k] = payload[k].toISOString();
    }
    try {
      const res = await conn.sobject('Event__c').create(payload);
      console.log('Created Event:', res);
    } catch (err) {
      console.error('Error creating Event record:', err && err.message ? err.message : err);
    }
  }

  // History (optional)
  if (history && history.length) {
    for (const h of history) {
      const payload = { ...h };
      try {
        const res = await conn.sobject('History__c').create(payload);
        console.log('Created History entry:', res);
      } catch (err) {
        console.error('Error creating History record:', err && err.message ? err.message : err);
      }
    }
  }
}

async function main() {
  try {
    // Ensure we have credentials and (if username/password) perform login to set SF_ACCESS_TOKEN / SF_INSTANCE_URL
    await sfConfig.ensureAuthAndLogin();

    const conn = new jsforce.Connection({ instanceUrl: process.env.SF_INSTANCE_URL, accessToken: process.env.SF_ACCESS_TOKEN });

    // Re-login to create a fresh session if using username/password (ensures describe sees latest metadata)
    try {
      if (process.env.SF_USERNAME && process.env.SF_PASSWORD) {
        console.log('Re-logging in using username/password to ensure fresh session...');
        await conn.login(process.env.SF_USERNAME, `${process.env.SF_PASSWORD}${process.env.SF_TOKEN || ''}`);
        process.env.SF_ACCESS_TOKEN = conn.accessToken;
        process.env.SF_INSTANCE_URL = conn.instanceUrl;
      }
    } catch (err) {
      console.warn('Re-login failed (continuing with existing token):', err && err.message ? err.message : err);
    }

    // Wait/poll for required fields to appear on Volunteer__c before inserting
    const requiredVolunteerFields = ['Email__c', 'Phone__c', 'First_Name__c', 'Last_Name__c'];
    console.log('Waiting for required Volunteer__c fields to be available...');
    const ok = await waitForFields(conn, 'Volunteer__c', requiredVolunteerFields, 3 * 60 * 1000, 5000);
    if (!ok) {
      console.error('Required fields did not appear on Volunteer__c within timeout. Aborting seed.');
      process.exit(2);
    }

    // Create records
    await createRecords(conn);

    console.log('Seed complete.');
    process.exit(0);
  } catch (err) {
    console.error('Seed runner failed:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = main;
