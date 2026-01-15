/**
 * salesForceConfig.js
 * Centralizes reading Salesforce credentials from environment variables
 * and provides helpers for building connection parameters and masked logs.
 *
 * Exports:
 *  - getSalesforceConfig(): returns parsed config and chosen auth mode
 *  - getConnectionParams(): returns object { authMode, accessToken, instanceUrl, username, password, loginUrl }
 *  - maskForLogs(value, showStart): utility to mask tokens/urls for safe logging
 *  - ensureAuthPresent(): throws if no recognizable auth config is present
 */

function maskForLogs(value, showStart = 8) {
  if (!value) return 'undefined';
  if (value.length <= showStart + 4) return '*****';
  return `${value.slice(0, showStart)}...${value.slice(-4)}`;
}

function getSalesforceConfig() {
  const {
    SF_ACCESS_TOKEN,
    SF_INSTANCE_URL,
    SF_INSTANCE,
    SF_USERNAME,
    SF_PASSWORD,
    SF_LOGIN_URL,
    SF_CLIENT_ID,
    SF_CLIENT_SECRET,
    SF_TOKEN
  } = process.env;

  const config = {
    raw: {
      SF_ACCESS_TOKEN,
      SF_INSTANCE_URL,
      SF_USERNAME,
      SF_PASSWORD,
      SF_LOGIN_URL,
      SF_CLIENT_ID,
      SF_CLIENT_SECRET,
      SF_TOKEN
    }
  };

  // Priority: access token + instanceUrl (preferred for CLI-authorized flows)
  // Accept either SF_INSTANCE_URL or SF_INSTANCE (historical naming) for an instance URL.
  const instanceUrlVal = SF_INSTANCE_URL || SF_INSTANCE;
  if (SF_ACCESS_TOKEN && instanceUrlVal) {
    config.authMode = 'token';
    config.accessToken = SF_ACCESS_TOKEN;
    config.instanceUrl = instanceUrlVal;
  } else if (SF_USERNAME && SF_PASSWORD) {
    // username/password + optional loginUrl (supports security token appended to password)
    config.authMode = 'userpass';
    config.username = SF_USERNAME;
    config.password = SF_PASSWORD;
    config.loginUrl = SF_LOGIN_URL || 'https://login.salesforce.com';
  } else if (SF_CLIENT_ID && SF_CLIENT_SECRET) {
    // client credentials (connected app) may be used elsewhere — report presence
    config.authMode = 'oauth-client';
    config.clientId = SF_CLIENT_ID;
    config.clientSecret = SF_CLIENT_SECRET;
  } else {
    config.authMode = 'none';
  }

  return config;
}

function getConnectionParams() {
  const cfg = getSalesforceConfig();
  if (cfg.authMode === 'token') {
    return {
      authMode: 'token',
      accessToken: cfg.accessToken,
      instanceUrl: cfg.instanceUrl
    };
  }
  if (cfg.authMode === 'userpass') {
    return {
      authMode: 'userpass',
      username: cfg.username,
      password: cfg.password,
      loginUrl: cfg.loginUrl
    };
  }
  if (cfg.authMode === 'oauth-client') {
    return {
      authMode: 'oauth-client',
      clientId: cfg.clientId,
      clientSecret: cfg.clientSecret
    };
  }
  return { authMode: 'none' };
}

const { execSync } = require('child_process');

function ensureAuthPresent() {
  const params = getConnectionParams();
  if (params.authMode === 'none') {
    const err = new Error('No Salesforce auth found in environment variables. Please set SF_ACCESS_TOKEN+SF_INSTANCE_URL or SF_USERNAME+SF_PASSWORD (and optional SF_LOGIN_URL).');
    err.code = 'NO_SF_AUTH';
    throw err;
  }
  return params;
}

// Ensure auth is present; if username/password are provided, perform a login
// and populate SF_ACCESS_TOKEN and SF_INSTANCE_URL in process.env so other
// scripts can use token-based auth transparently.
async function ensureAuthAndLogin() {
  const cfg = getSalesforceConfig();
  if (cfg.authMode === 'token') {
    // Validate instanceUrl looks absolute
    if (!cfg.instanceUrl || !/^https?:\/\//i.test(cfg.instanceUrl)) {
      const e = new Error('SF_INSTANCE_URL (or SF_INSTANCE) must be a valid absolute URL (e.g. https://your-instance.my.salesforce.com).');
      e.code = 'INVALID_INSTANCE_URL';
      throw e;
    }
    return { authMode: 'token', accessToken: cfg.accessToken, instanceUrl: cfg.instanceUrl };
  }

  if (cfg.authMode === 'userpass') {
    // If the Salesforce CLI (sf) is available and the target org matching the username
    // is authorized, prefer using its access token (avoids SOAP login issues).
    try {
      // Try to read the org by username (sf accepts username as target-org)
      const sfCmd = `sf org display --target-org ${cfg.username} --json`;
      const out = execSync(sfCmd, { encoding: 'utf8' });
      const parsed = JSON.parse(out);
      if (parsed && parsed.result && parsed.result.accessToken && parsed.result.instanceUrl) {
        process.env.SF_ACCESS_TOKEN = parsed.result.accessToken;
        process.env.SF_INSTANCE_URL = parsed.result.instanceUrl;
        return { authMode: 'token', accessToken: parsed.result.accessToken, instanceUrl: parsed.result.instanceUrl };
      }
    } catch (e) {
      // ignore CLI fallback failures and continue to attempt username/password login
    }
    // perform login via jsforce and set env for downstream tools
    const jsforce = require('jsforce');
    const token = process.env.SF_TOKEN || '';
    // Use instanceUrl for the loginUrl if provided, which can bypass some generic login blocks if pointing to specific domain
    // If org has SOAP disabled, this might still fail unless we use the custom WSDLs downloaded
    const loginUrl = cfg.instanceUrl || cfg.loginUrl || 'https://login.salesforce.com';
    const conn = new jsforce.Connection({ 
      loginUrl: loginUrl
    });
    try {
      await conn.login(cfg.username, `${cfg.password}${token}`);
      // export into process.env for other scripts that expect SF_ACCESS_TOKEN/SF_INSTANCE_URL
      process.env.SF_ACCESS_TOKEN = conn.accessToken;
      process.env.SF_INSTANCE_URL = conn.instanceUrl;
      return { authMode: 'token', accessToken: conn.accessToken, instanceUrl: conn.instanceUrl };
    } catch (err) {
      // If the org has SOAP login disabled, provide a helpful fallback path.
      const msg = err && err.message ? err.message : String(err);
      if (msg.includes('SOAP API login() is disabled')) {
        // If an access token + instance URL are already present in env, use them.
        if (process.env.SF_ACCESS_TOKEN && process.env.SF_INSTANCE_URL) {
          return { authMode: 'token', accessToken: process.env.SF_ACCESS_TOKEN, instanceUrl: process.env.SF_INSTANCE_URL };
        }

        const hint = `SOAP API login is disabled in this org. You can either enable SOAP API for the org or use an access-token-based auth flow.\n` +
          `If you have the Salesforce CLI (sf) configured, you can export the org's access token and instance URL into your environment (PowerShell example):\n` +
          `  $json = sf org display --target-org <alias> --json | ConvertFrom-Json;\n` +
          `  $env:SF_ACCESS_TOKEN = $json.result.accessToken;\n` +
          `  $env:SF_INSTANCE_URL = $json.result.instanceUrl;\n` +
          `Then re-run the init script. Alternatively, create a connected app and use OAuth client credentials.\n` +
          `Original error: ${msg}`;

        const e = new Error(`Salesforce login failed for user ${maskForLogs(cfg.username, 4)}: ${hint}`);
        e.code = 'SF_LOGIN_SOAP_DISABLED';
        throw e;
      }

      const e = new Error(`Salesforce login failed for user ${maskForLogs(cfg.username, 4)}: ${msg}`);
      e.code = 'SF_LOGIN_FAILED';
      throw e;
    }
  }

  // oauth-client or none: return current params (caller may handle oauth-client specially)
  return getConnectionParams();
}

module.exports = {
  getSalesforceConfig,
  getConnectionParams,
  ensureAuthPresent,
  ensureAuthAndLogin,
  maskForLogs
};
