#!/usr/bin/env node
/**
 * Deploys SFDX metadata incrementally to avoid Developer Edition limitations
 * Strategy: Deploy objects first, then fields in small batches
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const targetOrg = process.env.SF_USERNAME || 'starwarsgeek14mz.01f8d826fbec@agentforce.com';

console.log(`\n🚀 Incremental Deployment to: ${targetOrg}\n`);

function runCommand(cmd, description) {
  console.log(`\n📋 ${description}...`);
  try {
    execSync(cmd, { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
    return true;
  } catch (error) {
    console.error(`❌ Failed: ${description}`);
    return false;
  }
}

function wait(seconds) {
  console.log(`⏳ Waiting ${seconds} seconds for metadata propagation...`);
  execSync(`node -e "setTimeout(() => {}, ${seconds * 1000})"`, { 
    stdio: 'inherit', 
    cwd: path.resolve(__dirname, '..') 
  });
}

// Step 1: Generate metadata
console.log('Step 1: Generating SFDX metadata files...');
execSync('node scripts/generate-sfdx-metadata.js', { 
  stdio: 'inherit', 
  cwd: path.resolve(__dirname, '..') 
});

// Step 2: Deploy objects only (no fields)
console.log('\n📦 Step 2: Deploying object shells (5 objects)...');
const objects = [
  'Volunteer__c',
  'Event__c',
  'Registration__c',
  'VolunteerHours__c',
  'History__c'
];

for (const obj of objects) {
  const objPath = `force-app/default/objects/${obj}/${obj}.object-meta.xml`;
  runCommand(
    `sf project deploy start --source-dir "${objPath}" --target-org ${targetOrg} --wait 5`,
    `Deploying ${obj}`
  );
}

wait(10);

// Step 3: Deploy fields in batches of 10
console.log('\n📦 Step 3: Deploying fields in batches of 10...');

const objectsDir = path.resolve(__dirname, '../force-app/default/objects');
const allFields = [];

for (const obj of objects) {
  const fieldsDir = path.join(objectsDir, obj, 'fields');
  if (fs.existsSync(fieldsDir)) {
    const files = fs.readdirSync(fieldsDir);
    files.forEach(file => {
      if (file.endsWith('.field-meta.xml')) {
        allFields.push({
          object: obj,
          path: path.join(fieldsDir, file),
          name: file.replace('.field-meta.xml', '')
        });
      }
    });
  }
}

console.log(`\n📊 Total fields to deploy: ${allFields.length}`);

const batchSize = 10;
for (let i = 0; i < allFields.length; i += batchSize) {
  const batch = allFields.slice(i, i + batchSize);
  const batchNum = Math.floor(i / batchSize) + 1;
  const totalBatches = Math.ceil(allFields.length / batchSize);
  
  console.log(`\n📦 Batch ${batchNum}/${totalBatches}: Deploying ${batch.length} fields...`);
  
  // Build source-dir list for this batch
  const sourceDirs = batch.map(f => f.path).join(' ');
  
  // Deploy this batch
  const metadataList = batch.map(f => `CustomField:${f.object}.${f.name}`).join(',');
  runCommand(
    `sf project deploy start --metadata "${metadataList}" --target-org ${targetOrg} --wait 5`,
    `Batch ${batchNum}/${totalBatches}`
  );
  
  // Wait between batches
  if (i + batchSize < allFields.length) {
    wait(15);
  }
}

console.log('\n✅ Incremental deployment complete!');
console.log('\n⏳ Waiting 60 seconds for final propagation...');
wait(60);

console.log('\n✅ Ready to seed data!');
console.log('Run: node database/init/runSeed.js');
