#!/usr/bin/env node

/**
 * Check actual field status using multiple Salesforce APIs
 * to diagnose the metadata cache inconsistency
 */

const sfConfig = require('../config/salesForceConfig');

async function checkFieldStatus() {
    console.log('\n🔍 Checking Field Status Across Different APIs\n');
    console.log('═'.repeat(60));
    
    try {
        // Authenticate
        console.log('\n🔐 Authenticating...');
        const conn = await sfConfig.ensureAuthAndLogin();
        console.log('✅ Authenticated\n');
        
        const testFields = [
            { object: 'Volunteer__c', field: 'Email__c' },
            { object: 'Volunteer__c', field: 'Phone__c' },
            { object: 'Volunteer__c', field: 'First_Name__c' }
        ];
        
        for (const test of testFields) {
            console.log(`\n📋 Checking ${test.object}.${test.field}`);
            console.log('─'.repeat(60));
            
            // Method 1: Describe API (what jsforce uses)
            try {
                const describe = await conn.describe(test.object);
                const field = describe.fields.find(f => f.name === test.field);
                if (field) {
                    console.log(`✅ Describe API: Found (type: ${field.type})`);
                } else {
                    console.log(`❌ Describe API: NOT FOUND`);
                }
            } catch (err) {
                console.log(`❌ Describe API Error: ${err.message}`);
            }
            
            // Method 2: Tooling API - Query CustomField
            try {
                const fullName = `${test.object}.${test.field}`;
                const result = await conn.tooling.query(
                    `SELECT Id, DeveloperName, FullName, TableEnumOrId FROM CustomField WHERE DeveloperName = '${test.field.replace('__c', '')}'`
                );
                if (result.records.length > 0) {
                    console.log(`✅ Tooling API Query: Found (Id: ${result.records[0].Id})`);
                } else {
                    console.log(`❌ Tooling API Query: NOT FOUND`);
                }
            } catch (err) {
                console.log(`❌ Tooling API Query Error: ${err.message}`);
            }
            
            // Method 3: Metadata API - Read
            try {
                const metadata = await conn.metadata.read('CustomField', `${test.object}.${test.field}`);
                if (metadata && metadata.fullName) {
                    console.log(`✅ Metadata API: Found (type: ${metadata.type})`);
                } else {
                    console.log(`❌ Metadata API: NOT FOUND`);
                }
            } catch (err) {
                console.log(`❌ Metadata API Error: ${err.message}`);
            }
            
            // Method 4: SOQL Query attempt
            try {
                await conn.query(`SELECT ${test.field} FROM ${test.object} LIMIT 1`);
                console.log(`✅ SOQL: Queryable`);
            } catch (err) {
                if (err.message.includes('No such column')) {
                    console.log(`❌ SOQL: NOT QUERYABLE (${err.message.substring(0, 50)}...)`);
                } else {
                    console.log(`❌ SOQL Error: ${err.message.substring(0, 60)}...`);
                }
            }
        }
        
        console.log('\n' + '═'.repeat(60));
        console.log('\n💡 Analysis:');
        console.log('If Tooling/Metadata APIs show field exists but Describe/SOQL fail,');
        console.log('this indicates a metadata synchronization issue in Salesforce.');
        console.log('\nPossible fixes:');
        console.log('1. Force refresh via Setup UI (not programmatic)');
        console.log('2. Contact Salesforce Support');
        console.log('3. Use a different org type (not Developer Edition)');
        
    } catch (error) {
        console.error('\n❌ Fatal error:', error.message);
        process.exit(1);
    }
}

checkFieldStatus().then(() => {
    console.log('\n✅ Check complete\n');
}).catch(err => {
    console.error('\n❌ Error:', err);
    process.exit(1);
});
