#!/usr/bin/env node
const jsforce = require('jsforce');
const dotenv = require('dotenv');
const path = require('path');
const { buildObjectsMetadata } = require('./sfMetadata');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function connectWithFallback() {
  const loginUrl = process.env.SF_LOGIN_URL || process.env.LOGIN_URL || 'https://test.salesforce.com';
  const username = process.env.SF_USERNAME;
  const password = process.env.SF_PASSWORD;
  const token = process.env.SF_TOKEN || '';
  const accessToken = process.env.SF_ACCESS_TOKEN;
  const instanceUrl = process.env.SF_INSTANCE_URL;

  if (accessToken && instanceUrl) {
    return new jsforce.Connection({ accessToken, instanceUrl });
  }

  const conn = new jsforce.Connection({ loginUrl });
  if (username && password) {
    await conn.login(username, `${password}${token}`);
    return conn;
  }

  throw new Error('No Salesforce credentials found. Provide SF_ACCESS_TOKEN+SF_INSTANCE_URL or SF_USERNAME+SF_PASSWORD(+SF_TOKEN)');
}

async function main() {
  const args = process.argv.slice(2);
  const confirmFlag = process.env.METADATA_CONFIRM === 'true' || args.includes('--confirm');
  if (!confirmFlag) {
    console.error('This script will DELETE and RECREATE custom objects. Pass --confirm or set METADATA_CONFIRM=true to proceed.');
    process.exit(2);
  }

  const conn = await connectWithFallback();
  console.log('Connected to Salesforce (instance:', conn.instanceUrl, ')');

  const objects = buildObjectsMetadata();

  // Delete existing objects first (if present) - delete children before parents to avoid dependency blocks
  for (const obj of objects.slice().reverse()) {
    const fullName = obj.fullName;
    try {
      const existing = await conn.metadata.read('CustomObject', fullName).catch(() => null);
      if (existing && existing.fullName) {
        console.log(`Deleting CustomObject ${fullName} ...`);
        const delRes = await conn.metadata.delete('CustomObject', fullName);
        console.log(`Delete result for ${fullName}:`, delRes);
      } else {
        console.log(`CustomObject ${fullName} not present, skipping delete.`);
      }
    } catch (err) {
      console.error(`Error checking/deleting ${fullName}:`, err && err.message ? err.message : err);
    }
  }

  // Small delay to let deletions settle (metadata operations are async in the platform)
  await new Promise(r => setTimeout(r, 3000));

  // Helper: ensure each field exists individually (creates CustomField entries when missing)
  async function ensureFieldsForObject(connection, objDef) {
    if (!objDef.fields || !objDef.fields.length) return;
    for (const f of objDef.fields) {
      const fieldFullName = `${objDef.fullName}.${f.fullName}`;
      try {
        const existingField = await connection.metadata.read('CustomField', fieldFullName).catch(() => null);
        if (existingField && existingField.fullName) {
          // field exists
          continue;
        }
      } catch (e) {
        // proceed to try create
      }

      const fieldMeta = { fullName: fieldFullName, label: f.label, type: f.type };
      if (f.length) fieldMeta.length = f.length;
      if (f.precision) fieldMeta.precision = f.precision;
      if (f.scale) fieldMeta.scale = f.scale;
      if (f.visibleLines) fieldMeta.visibleLines = f.visibleLines;
      if (f.defaultValue !== undefined) fieldMeta.defaultValue = f.defaultValue;
      if (f.valueSet) fieldMeta.valueSet = f.valueSet;
      if (f.referenceTo) fieldMeta.referenceTo = f.referenceTo;
      if (f.relationshipName) fieldMeta.relationshipName = f.relationshipName;
      if (f.relationshipLabel) fieldMeta.relationshipLabel = f.relationshipLabel;
      if (f.deleteConstraint) fieldMeta.deleteConstraint = f.deleteConstraint;

      try {
        const createFieldRes = await connection.metadata.create('CustomField', fieldMeta);
        console.log(`Field create result for ${fieldFullName}:`, createFieldRes);
      } catch (cfErr) {
        console.error(`Field create error for ${fieldFullName}:`, cfErr && cfErr.message ? cfErr.message : cfErr);
      }
    }
  }

  // Create objects fresh
  for (const obj of objects) {
    try {
      console.log(`Creating CustomObject ${obj.fullName} ...`);
      const res = await conn.metadata.create('CustomObject', obj);
      console.log(`Create result for ${obj.fullName}:`, res);

      // After creating the object, also ensure each field exists as an individual CustomField.
      // This guards against cases where object-level create doesn't immediately surface fields to runtime describe.
      await ensureFieldsForObject(conn, obj);

      // brief pause to allow metadata propagation
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`Error creating ${obj.fullName}:`, err && err.message ? err.message : err);
    }
  }

  console.log('Done. Note: Deleting objects removed their data; verify the org and run seed if desired.');
  process.exit(0);
}

main().catch(err => {
  console.error('Unexpected error:', err && err.message ? err.message : err);
  process.exit(2);
});