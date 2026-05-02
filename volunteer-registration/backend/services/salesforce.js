const path = require('path');
const fs = require('fs');
const jsforce = require('jsforce');
const debug = require('debug')('app:salesforce');
const envPath = path.resolve(__dirname, '../../../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

let conn = null;

async function connect() {
  if (conn && conn.accessToken) return conn;

  const loginUrl = process.env.SF_LOGIN_URL || 'https://login.salesforce.com';
  const username = process.env.SF_USERNAME;
  const password = process.env.SF_PASSWORD; // password + security token may be required
  const token = process.env.SF_TOKEN || '';

  conn = new jsforce.Connection({ loginUrl });

  // Prefer an existing access token and instance URL when provided (CLI or env)
  const accessToken = process.env.SF_ACCESS_TOKEN;
  const instanceUrl = process.env.SF_INSTANCE_URL;
  if (accessToken && instanceUrl) {
    conn = new jsforce.Connection({ accessToken, instanceUrl });
    return conn;
  }

  // Fallback to username/password login (may require security token appended to password)
  if (username && password) {
    try {
      await conn.login(username, password + (token || ''), (err, userInfo) => {
        if (err) throw err;
        debug('Salesforce login successful for user id', userInfo.id);
      });
      return conn;
    } catch (err) {
      debug('Salesforce login error:', err && err.message ? err.message : err);
      throw err;
    }
  }

  throw new Error('No Salesforce credentials provided. Set SF_USERNAME and SF_PASSWORD+SF_TOKEN, or set SF_ACCESS_TOKEN and SF_INSTANCE_URL');
}

async function query(soql) {
  const c = await connect();
  return c.query(soql);
}

async function create(sobjectName, data) {
  const c = await connect();
  return c.sobject(sobjectName).create(data);
}

async function update(sobjectName, id, data) {
  const c = await connect();
  return c.sobject(sobjectName).update({ Id: id, ...data });
}

async function del(sobjectName, id) {
  const c = await connect();
  return c.sobject(sobjectName).destroy(id);
}

async function retrieve(sobjectName, id) {
  const c = await connect();
  return c.sobject(sobjectName).retrieve(id);
}

module.exports = {
  connect,
  query,
  create,
  update,
  delete: del,
  retrieve
};
