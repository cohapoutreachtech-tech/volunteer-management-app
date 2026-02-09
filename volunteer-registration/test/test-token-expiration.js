require('dotenv').config({ path: '../../.env' });

async function testTokenExpiration(tokenToTest, testName) {
    const instanceUrl = process.env.SF_INSTANCE_URL;
    const apiUrl = `${instanceUrl}/services/apexrest/api/auth/login`;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${testName}`);
    console.log('='.repeat(60));
    console.log(`Token: ${tokenToTest.substring(0, 30)}...`);
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tokenToTest}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@cohap.org',
                password: 'admin123'
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log(`✅ Status: ${response.status} - Token is VALID`);
            console.log('Response:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
        } else {
            console.log(`❌ Status: ${response.status} - Token is INVALID/EXPIRED`);
            console.log('Error:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.log('❌ Network Error:', error.message);
    }
}

async function runTests() {
    console.log('\n🧪 Token Expiration Test Suite');
    console.log('Testing different token scenarios...\n');
    
    // Test 1: Current valid token
    const currentToken = process.env.SF_ACCESS_TOKEN;
    await testTokenExpiration(currentToken, 'Current Token from .env (Should be VALID)');
    
    // Test 2: Invalid token (simulate expired)
    const invalidToken = '00Dfj00000HPkAj!INVALID_TOKEN_SIMULATION';
    await testTokenExpiration(invalidToken, 'Simulated Invalid Token (Should FAIL)');
    
    // Test 3: Malformed token
    const malformedToken = 'completely-wrong-format';
    await testTokenExpiration(malformedToken, 'Malformed Token (Should FAIL)');
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));
    console.log('✅ Valid token should return 200 with JWT');
    console.log('❌ Invalid/expired tokens should return 401 Unauthorized');
    console.log('\nTo test real expiration:');
    console.log('1. Wait 12-24 hours for token to expire naturally');
    console.log('2. OR manually revoke the session in Salesforce Setup > Session Management');
    console.log('3. OR replace SF_ACCESS_TOKEN in .env with an old/invalid token');
    console.log('\nTo refresh expired token:');
    console.log('  node refresh-token.js\n');
}

runTests();
