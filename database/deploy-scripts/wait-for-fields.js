#!/usr/bin/env node
/**
 * Monitors Salesforce field propagation and runs seed when ready
 */

const { execSync } = require('child_process');

const targetOrg = 'starwarsgeek14mz.01f8d826fbec@agentforce.com';
const requiredFields = {
  'Volunteer__c': ['Email__c', 'Phone__c', 'First_Name__c', 'Last_Name__c'],
  'Event__c': ['Event_Time__c', 'Title__c', 'Event_Date__c']
};

function checkField(object, field) {
  try {
    const query = `SELECT Id, ${field} FROM ${object} LIMIT 1`;
    execSync(`sf data query --query "${query}" --target-org ${targetOrg}`, { 
      stdio: 'pipe' 
    });
    return true;
  } catch (error) {
    return false;
  }
}

function checkAllFields() {
  console.log(`\n🔍 Checking field availability... (${new Date().toLocaleTimeString()})`);
  let allReady = true;
  
  for (const [object, fields] of Object.entries(requiredFields)) {
    console.log(`\n  ${object}:`);
    for (const field of fields) {
      const exists = checkField(object, field);
      const status = exists ? '✅' : '⏳';
      console.log(`    ${status} ${field}`);
      if (!exists) allReady = false;
    }
  }
  
  return allReady;
}

async function monitor() {
  console.log('🚀 Salesforce Field Propagation Monitor');
  console.log('======================================\n');
  console.log('Waiting for fields to become queryable...');
  console.log('This typically takes 15-60 minutes in Developer Edition orgs.\n');
  
  const maxChecks = 60; // Check for up to 2 hours
  const checkIntervalMinutes = 2;
  
  for (let i = 0; i < maxChecks; i++) {
    const ready = checkAllFields();
    
    if (ready) {
      console.log('\n\n✅ All required fields are now queryable!');
      console.log('\n🌱 Running seed script...\n');
      
      try {
        execSync('node database/init/runSeed.js', { stdio: 'inherit' });
        console.log('\n✅ Database seeded successfully!');
        process.exit(0);
      } catch (error) {
        console.error('\n❌ Seeding failed:', error.message);
        process.exit(1);
      }
    }
    
    if (i < maxChecks - 1) {
      console.log(`\n⏳ Not ready yet. Waiting ${checkIntervalMinutes} minutes...`);
      console.log(`   (Check ${i + 1}/${maxChecks}, next check at ${new Date(Date.now() + checkIntervalMinutes * 60000).toLocaleTimeString()})`);
      
      // Wait for next check
      await new Promise(resolve => setTimeout(resolve, checkIntervalMinutes * 60 * 1000));
    }
  }
  
  console.log('\n⚠️ Timeout reached after 2 hours. Fields still not ready.');
  console.log('This may indicate an issue with the Salesforce org.');
  process.exit(1);
}

monitor().catch(err => {
  console.error('❌ Monitor error:', err);
  process.exit(1);
});
