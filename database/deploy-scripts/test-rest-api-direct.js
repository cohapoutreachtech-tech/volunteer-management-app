#!/usr/bin/env node

/**
 * Test field access using direct REST API calls
 * This bypasses jsforce's caching and uses raw HTTP requests
 */

const https = require('https');
const sfConfig = require('../config/salesForceConfig');

async function makeRestRequest(accessToken, instanceUrl, method, path, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, instanceUrl);
        const options = {
            method: method,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        };
        
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });
        
        req.on('error', reject);
        
        if (body) {
            req.write(JSON.stringify(body));
        }
        
        req.end();
    });
}

async function testDirectRestAPI() {
    console.log('\n🔬 Testing Direct REST API Access\n');
    console.log('═'.repeat(70));
    
    try {
        // Authenticate
        console.log('\n🔐 Authenticating...');
        const conn = await sfConfig.ensureAuthAndLogin();
        const accessToken = conn.accessToken;
        const instanceUrl = conn.instanceUrl;
        console.log(`✅ Connected to: ${instanceUrl}\n`);
        
        // Test 1: Describe via REST API
        console.log('📋 Test 1: Describe Volunteer__c via REST API');
        console.log('─'.repeat(70));
        const describeResult = await makeRestRequest(
            accessToken,
            instanceUrl,
            'GET',
            '/services/data/v59.0/sobjects/Volunteer__c/describe'
        );
        
        if (describeResult.status === 200) {
            const fields = describeResult.data.fields || [];
            const customFields = fields.filter(f => f.name.endsWith('__c'));
            console.log(`✅ Status: ${describeResult.status}`);
            console.log(`✅ Found ${customFields.length} custom fields:`);
            
            const testFields = ['Email__c', 'Phone__c', 'First_Name__c', 'Last_Name__c'];
            testFields.forEach(fieldName => {
                const found = fields.find(f => f.name === fieldName);
                if (found) {
                    console.log(`   ✓ ${fieldName} (${found.type})`);
                } else {
                    console.log(`   ✗ ${fieldName} - NOT FOUND`);
                }
            });
        } else {
            console.log(`❌ Status: ${describeResult.status}`);
            console.log(`Error: ${JSON.stringify(describeResult.data, null, 2)}`);
        }
        
        // Test 2: Try to create a record via REST API
        console.log('\n📝 Test 2: Create Volunteer via REST API');
        console.log('─'.repeat(70));
        
        const volunteerData = {
            First_Name__c: 'REST',
            Last_Name__c: 'API Test',
            Email__c: 'rest.test@example.com',
            Phone__c: '555-REST-API'
        };
        
        const createResult = await makeRestRequest(
            accessToken,
            instanceUrl,
            'POST',
            '/services/data/v59.0/sobjects/Volunteer__c',
            volunteerData
        );
        
        if (createResult.status === 201) {
            console.log(`✅ Status: ${createResult.status}`);
            console.log(`✅ Record created! Id: ${createResult.data.id}`);
            console.log('\n🎉 SUCCESS! Fields are accessible via REST API!');
            console.log('📌 Check Salesforce UI: App Launcher → Volunteers → You should see "REST API Test"');
            
            // Test 3: Query the record back
            console.log('\n🔍 Test 3: Query the created record');
            console.log('─'.repeat(70));
            const query = encodeURIComponent(`SELECT Id, First_Name__c, Last_Name__c, Email__c, Phone__c FROM Volunteer__c WHERE Email__c = 'rest.test@example.com'`);
            const queryResult = await makeRestRequest(
                accessToken,
                instanceUrl,
                'GET',
                `/services/data/v59.0/query?q=${query}`
            );
            
            if (queryResult.status === 200 && queryResult.data.records.length > 0) {
                console.log(`✅ Query successful! Found record:`);
                console.log(JSON.stringify(queryResult.data.records[0], null, 2));
            } else {
                console.log(`⚠️  Query status: ${queryResult.status}`);
                console.log(`Records found: ${queryResult.data.records?.length || 0}`);
            }
            
        } else {
            console.log(`❌ Status: ${createResult.status}`);
            console.log(`Error: ${JSON.stringify(createResult.data, null, 2)}`);
            
            if (createResult.data[0]?.errorCode === 'INVALID_FIELD') {
                console.log('\n⚠️  Fields not accessible via REST API either');
                console.log('This confirms the metadata cache issue affects all APIs');
            }
        }
        
        console.log('\n' + '═'.repeat(70));
        console.log('\n💡 Analysis:');
        console.log('- If REST API works: jsforce has stale cache → solution: use REST API');
        console.log('- If REST API fails: Salesforce org issue → solution: contact support or new org');
        console.log('- Your UI screenshots show fields exist, so this is definitely a cache issue');
        
    } catch (error) {
        console.error('\n❌ Fatal error:', error.message);
        process.exit(1);
    }
}

testDirectRestAPI().then(() => {
    console.log('\n✅ Test complete\n');
}).catch(err => {
    console.error('\n❌ Error:', err);
    process.exit(1);
});
