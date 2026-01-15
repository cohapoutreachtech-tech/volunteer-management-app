const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
const jsforce = require('jsforce');
const sfConfig = require('../config/salesForceConfig');
const { volunteers, events, history, registrations, volunteerHours } = require('./seedData');

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
  const createdVolunteerIds = [];
  const createdEventIds = [];

  // Volunteers
  console.log('Creating Volunteers...');
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
      if (res.success && res.id) createdVolunteerIds.push(res.id);
    } catch (err) {
      console.error('Error creating Volunteer record:', err && err.message ? err.message : err);
    }
  }

  // Events
  console.log('Creating Events...');
  for (const e of events) {
    const payload = { ...e };
    if (payload.name) { payload.Name = payload.name; delete payload.name; }
    for (const k of Object.keys(payload)) {
      if (payload[k] instanceof Date) payload[k] = payload[k].toISOString();
    }
    try {
      const res = await conn.sobject('Event__c').create(payload);
      console.log('Created Event:', res);
      if (res.success && res.id) createdEventIds.push(res.id);
    } catch (err) {
      console.error('Error creating Event record:', err && err.message ? err.message : err);
    }
  }

  // Registrations - link to created Volunteers and Events
  if (registrations && registrations.length && createdVolunteerIds.length && createdEventIds.length) {
    console.log('Creating Registrations...');
    for (let i = 0; i < registrations.length; i++) {
      const r = registrations[i];
      const payload = { ...r };
      if (payload.name) { payload.Name = payload.name; delete payload.name; }
      // Link to Volunteers and Events (cycle through if more registrations than records)
      payload.Volunteer__c = createdVolunteerIds[i % createdVolunteerIds.length];
      payload.Event__c = createdEventIds[i % createdEventIds.length];
      for (const k of Object.keys(payload)) {
        if (payload[k] instanceof Date) payload[k] = payload[k].toISOString();
      }
      try {
        const res = await conn.sobject('Registration__c').create(payload);
        console.log('Created Registration:', res);
      } catch (err) {
        console.error('Error creating Registration record:', err && err.message ? err.message : err);
      }
    }
  }

  // Volunteer Hours - link to created Volunteers and Events
  if (volunteerHours && volunteerHours.length && createdVolunteerIds.length && createdEventIds.length) {
    console.log('Creating Volunteer Hours...');
    for (let i = 0; i < volunteerHours.length; i++) {
      const vh = volunteerHours[i];
      const payload = { ...vh };
      if (payload.name) { payload.Name = payload.name; delete payload.name; }
      // Link to Volunteers and Events (cycle through if more hours than records)
      payload.Volunteer__c = createdVolunteerIds[i % createdVolunteerIds.length];
      payload.Event__c = createdEventIds[i % createdEventIds.length];
      for (const k of Object.keys(payload)) {
        if (payload[k] instanceof Date) payload[k] = payload[k].toISOString();
      }
      try {
        const res = await conn.sobject('VolunteerHours__c').create(payload);
        console.log('Created VolunteerHours:', res);
      } catch (err) {
        console.error('Error creating VolunteerHours record:', err && err.message ? err.message : err);
      }
    }
  }

  // History (optional)
  if (history && history.length) {
    console.log('Creating History...');
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

    console.log('Starting seed process...');
    
    // Create records immediately (no pre-validation)
    await createRecords(conn);

    console.log('Records created. Validating seeded objects in order...');
    
    // After seeding, validate all objects in the order they were seeded
    const objectsToValidate = [
      { name: 'Volunteer__c', label: 'Volunteer' },
      { name: 'Event__c', label: 'Event' },
      { name: 'Registration__c', label: 'Registration' },
      { name: 'VolunteerHours__c', label: 'Volunteer Hours' },
      { name: 'History__c', label: 'History' }
    ];

    for (const obj of objectsToValidate) {
      try {
        const result = await conn.query(`SELECT COUNT() cnt FROM ${obj.name}`);
        const count = result?.records?.[0]?.cnt || 0;
        if (count > 0) {
          console.log(`✓ ${obj.label}: ${count} record(s) created.`);
        } else {
          console.warn(`⚠ ${obj.label}: No records found.`);
        }
      } catch (validationErr) {
        console.warn(`⚠ ${obj.label}: Could not validate - ${validationErr.message}`);
      }
    }

    console.log('Seed complete.');
    process.exit(0);
  } catch (err) {
    console.error('Seed runner failed:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = main;
