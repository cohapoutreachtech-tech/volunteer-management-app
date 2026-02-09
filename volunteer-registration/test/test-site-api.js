require('dotenv').config({ path: '../../.env' });

async function testSiteAPI() {
    console.log('=========================================');
    console.log('Testing Salesforce Site API (No Token!)');
    console.log('=========================================\n');
    
    const siteUrl = process.env.SF_SITE_URL || 'https://YOUR-SITE-URL.my.site.com';
    const apiUrl = `${siteUrl}/services/apexrest/api/auth/login`;
    
    console.log('Configuration:');
    console.log(`  Site URL: ${siteUrl}`);
    console.log(`  API Endpoint: ${apiUrl}`);
    console.log('  🔓 No Authorization token needed!\n');
    
    console.log('Attempting login with volunteer credentials:');
    console.log('  Email: admin@cohap.org');
    console.log('  Password: ********\n');
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
                // ⚠️ NO Authorization header needed!
            },
            body: JSON.stringify({
                email: 'admin@cohap.org',
                password: 'admin123'
            })
        });
        
        const data = await response.json();
        
        console.log(`Response Status: ${response.status}\n`);
        
        if (response.ok) {
            console.log('✅ SUCCESS! Salesforce Site API working!\n');
            console.log('Response Data:');
            console.log(JSON.stringify(data, null, 2));
            
            if (data.token) {
                console.log(`\n✅ JWT Token received: ${data.token.substring(0, 50)}...`);
                console.log('\n🎉 PUBLIC API IS WORKING - NO TOKEN EXPIRATION!');
            }
        } else {
            console.log('❌ ERROR: Request failed\n');
            console.log('Response Data:', JSON.stringify(data, null, 2));
            console.log('\n⚠️  If you get "Insufficient Privileges":');
            console.log('   1. Check Setup → Sites → Public Access Settings');
            console.log('   2. Enable AuthAPI in Apex Class Access');
            console.log('   3. Enable Volunteer__c object permissions (Read, Create, Edit)');
            console.log('   4. Enable field-level security for Email__c and Pass_Hash__c');
        }
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        console.log('\n⚠️  Common issues:');
        console.log('   1. SF_SITE_URL not set in .env');
        console.log('   2. Site not activated in Setup → Sites');
        console.log('   3. CORS not configured (if calling from browser)');
        console.log('\nSee SALESFORCE_SITES_SETUP.md for complete setup instructions');
    }
}

testSiteAPI();
