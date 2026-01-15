#!/usr/bin/env node
const jsforce = require('jsforce');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { createMetadata } = require('./sfMetadata');

// Load .env from current working dir if present, otherwise fall back to repo root
let envPath = path.resolve(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  envPath = path.resolve(__dirname, '..', '..', '.env');
}
dotenv.config({ path: envPath });

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const confirmFlag = process.env.METADATA_CONFIRM === 'true' || args.includes('--confirm');

  if (apply && !confirmFlag) {
    console.error('Applying metadata changes requires confirmation. Set METADATA_CONFIRM=true or pass --confirm. Run without --apply for a dry-run.');
    process.exit(2);
  }

  const loginUrl = process.env.SF_LOGIN_URL || process.env.LOGIN_URL || 'https://test.salesforce.com';
  const username = process.env.SF_USERNAME || process.env.SALES_FORCE_USER || process.env.SALES_FORCE_USER;
  const password = process.env.SF_PASSWORD || process.env.SALES_FORCE_PASSWORD || process.env.SALES_FORCE_PASSWORD;
  const token = process.env.SF_TOKEN || process.env.SALES_FORCE_SECURITY_TOKEN || process.env.SALES_FORCE_SECURITY_TOKEN || '';

  // Do not exit here; allow the script to fall back to OAuth password grant or raw access token + instance URL

  const axios = require('axios');

  let conn;

  // Helper: try OAuth password grant using a connected app if client id/secret are available
  async function tryPasswordGrant() {
    const clientId = process.env.SF_CLIENT_ID || process.env.SALES_FORCE_CLIENT_ID;
    const clientSecret = process.env.SF_CLIENT_SECRET || process.env.SALES_FORCE_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;

    const tokenUrl = loginUrl.replace(/\/$/, '') + '/services/oauth2/token';
    try {
      const resp = await axios.post(tokenUrl, new URLSearchParams({
        grant_type: 'password',
        client_id: clientId,
        client_secret: clientSecret,
        username,
        password: `${password}${token}`
      }).toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000
      });
      const data = resp.data;
      if (data && data.access_token && data.instance_url) {
        return { accessToken: data.access_token, instanceUrl: data.instance_url };
      }
    } catch (e) {
      // ignore and return null
    }
    return null;
  }

  try {
    // First, try username/password login (may be disabled in some orgs)
    conn = new jsforce.Connection({ loginUrl });
    await conn.login(username, `${password}${token}`);
    console.log(`Connected to Salesforce (instance: ${conn.instanceUrl}) via username/password`);
  } catch (err) {
    // Try connected-app password grant exchange
    const grant = await tryPasswordGrant();
    if (grant) {
      conn = new jsforce.Connection({ accessToken: grant.accessToken, instanceUrl: grant.instanceUrl });
      console.log('Connected to Salesforce via OAuth password grant (connected app)');
    } else {
      // Fallback to raw access token from env
      const accessToken = process.env.SF_ACCESS_TOKEN || process.env.SALES_FORCE_ACCESS_TOKEN;
      const instanceUrl = process.env.SF_INSTANCE_URL || process.env.SALES_FORCE_INSTANCE_URL || process.env.LOGIN_URL;
      if (accessToken && instanceUrl) {
        conn = new jsforce.Connection({ accessToken, instanceUrl });
        console.log('Connected to Salesforce using SF_ACCESS_TOKEN and SF_INSTANCE_URL from environment');
      } else {
    console.error('Salesforce login failed:', err && err.message ? err.message : err);
    console.error('If SOAP API login is disabled for this org, either:');
    console.error(' - set SF_ACCESS_TOKEN and SF_INSTANCE_URL in your .env (obtain via sfdx), or');
    console.error(' - create a Connected App and set SF_CLIENT_ID and SF_CLIENT_SECRET in .env to allow the script to exchange credentials for a token.');
        process.exit(2);
      }
    }
  }

  console.log(`Connected to Salesforce (instance: ${conn.instanceUrl || loginUrl})`);

  const results = await createMetadata(conn, apply);

  console.log('Metadata operation results:');
  for (const r of results) {
    if (r.status === 'would-create') {
      console.log(` - ${r.fullName}: would create`);
    } else if (r.status === 'exists') {
      console.log(` - ${r.fullName}: already exists, skipping`);
    } else if (r.status === 'updated') {
      console.log(` - ${r.fullName}: updated (result: ${JSON.stringify(r.result)})`);
    } else if (r.status === 'error-update') {
      console.error(` - ${r.fullName}: error during update: ${r.error}`);
    } else if (r.status === 'created') {
      console.log(` - ${r.fullName}: created (result: ${JSON.stringify(r.result)})`);
    } else if (r.status === 'error') {
      console.error(` - ${r.fullName}: error: ${r.error}`);
    }
  }

  console.log('Done.');
  process.exit(0);
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(2);
});