const sfConfig = require('../database/config/salesForceConfig');
// Load .env
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

(async () => {
  try {
    console.log('Testing authentication via salesForceConfig...');
    const auth = await sfConfig.ensureAuthAndLogin();
    
    console.log('\nSUCCESS! The application can authenticate.');
    console.log(`Auth Mode: ${auth.authMode}`);
    console.log(`Instance:  ${auth.instanceUrl}`);
    console.log('Token:     [Preserved]');
    
    if (auth.authMode === 'token') {
        console.log('\nNOTE: We are using the CLI Access Token to bypass the Org\'s SOAP Login restriction.');
        console.log('You do NOT need to enable SOAP login in the Org as long as you have the CLI authorized.');
    }

  } catch (err) {
    console.error('Auth verification failed:', err.message);
    process.exit(1);
  }
})();
