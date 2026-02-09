require('dotenv').config({ path: '../../.env' });

async function testSalesforceApexAPI() {
    console.log('=========================================');
    console.log('Testing Salesforce Apex REST API');
    console.log('=========================================\n');
    
    const instanceUrl = process.env.SF_INSTANCE_URL;
    const accessToken = process.env.SF_ACCESS_TOKEN;
    const apiUrl = `${instanceUrl}/services/apexrest/api/auth/login`;
    
    console.log('Configuration:');
    console.log(`  Salesforce URL: ${apiUrl}`);
    console.log(`  Access Token: ${accessToken ? accessToken.substring(0, 20) + '...' : 'NOT SET'}\n`);
    
    console.log('Attempting login with volunteer credentials:');
    console.log('  Email: admin@cohap.org');
    console.log('  Password: ********\n');
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@cohap.org',
                password: 'admin123'
            })
        });
        
        const data = await response.json();
        
        console.log(`Response Status: ${response.status}\n`);
        
        if (response.ok) {
            console.log('✅ SUCCESS! Salesforce Apex API working!\n');
            console.log('Response Data:');
            console.log(JSON.stringify(data, null, 2));
            
            if (data.token) {
                console.log(`\n✅ JWT Token received: ${data.token.substring(0, 50)}...`);
                console.log('\nYou can now use this token in the Authorization header:');
                console.log(`Authorization: Bearer ${data.token.substring(0, 50)}...`);
            }
        } else {
            console.log('❌ ERROR: Request failed\n');
            console.log('Response Data:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.log('❌ ERROR:', error.message);
    }
}

testSalesforceApexAPI();
