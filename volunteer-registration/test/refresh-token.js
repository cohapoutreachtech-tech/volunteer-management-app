const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Refreshing Salesforce access token...\n');

try {
    // Get new access token from SF CLI
    const result = execSync('sf org display --target-org dev-org --json', { encoding: 'utf8' });
    const data = JSON.parse(result);
    const newToken = data.result.accessToken;
    
    if (!newToken) {
        console.error('❌ Failed to retrieve access token');
        process.exit(1);
    }
    
    console.log('✅ New token retrieved:', newToken.substring(0, 20) + '...\n');
    
    // Read .env file
    const envPath = path.join(__dirname, '../../.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Replace SF_ACCESS_TOKEN value
    const tokenRegex = /SF_ACCESS_TOKEN=.*/;
    if (tokenRegex.test(envContent)) {
        envContent = envContent.replace(tokenRegex, `SF_ACCESS_TOKEN=${newToken}`);
        fs.writeFileSync(envPath, envContent, 'utf8');
        console.log('✅ Updated SF_ACCESS_TOKEN in .env file\n');
    } else {
        console.error('❌ SF_ACCESS_TOKEN not found in .env file');
        process.exit(1);
    }
    
    console.log('🎉 Token refresh complete!\n');
    console.log('Token expires in approximately 12-24 hours.');
    console.log('Run this script again when the token expires.\n');
    
} catch (error) {
    console.error('❌ Error refreshing token:', error.message);
    console.error('\nMake sure you have SF CLI installed and authenticated:');
    console.error('  sf org login web --alias dev-org --instance-url https://login.salesforce.com');
    process.exit(1);
}
