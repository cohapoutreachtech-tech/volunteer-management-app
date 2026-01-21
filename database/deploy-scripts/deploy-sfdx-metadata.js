#!/usr/bin/env node
/**
 * Deploys SFDX metadata to Salesforce using SF CLI
 * This is more reliable than jsforce for complex metadata operations
 */

const { execSync } = require('child_process');
const path = require('path');

// Get target org from environment
const targetOrg = process.env.SF_USERNAME || 'starwarsgeek14mz.01f8d826fbec@agentforce.com';

console.log(`\n🚀 Deploying metadata to Salesforce org: ${targetOrg}\n`);

try {
  // Step 1: Generate SFDX metadata files
  console.log('Step 1: Generating SFDX metadata files...');
  execSync('node scripts/generate-sfdx-metadata.js', { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
  
  // Step 2: Deploy to Salesforce
  console.log('\nStep 2: Deploying to Salesforce...');
  const deployCmd = `sf project deploy start --source-dir force-app --target-org ${targetOrg} --wait 10`;
  execSync(deployCmd, { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
  
  console.log('\n✅ Deployment completed successfully!');
  console.log('\n⏳ Waiting 30 seconds for metadata to propagate...');
  
  // Wait for metadata propagation
  setTimeout(() => {
    console.log('\n✅ Ready to seed data!');
    console.log('Run: node database/init/runSeed.js');
    process.exit(0);
  }, 30000);
  
} catch (error) {
  console.error('\n❌ Deployment failed:', error.message);
  process.exit(1);
}
