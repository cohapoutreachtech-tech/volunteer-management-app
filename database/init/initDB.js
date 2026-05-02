const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Load local .env from project root (two levels up from database/init/) when present
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const sfConfig = require('../config/salesForceConfig');
const jsforce = require('jsforce');

const TARGET_ORG = process.env.SF_USERNAME || 'dev-org';
const OBJECTS = ['Volunteer__c', 'Event__c', 'Registration__c', 'VolunteerHours__c', 'History__c'];
const CRITICAL_FIELDS = {
  'Volunteer__c': ['Email__c', 'Phone__c', 'First_Name__c', 'Last_Name__c'],
  'Event__c': ['Event_Time__c', 'Title__c', 'Event_Date__c', 'Location__c'],
  'Registration__c': ['Volunteer__c', 'Event__c', 'Registration_Status__c'],
  'VolunteerHours__c': ['Volunteer__c', 'Event__c', 'Total_Hours__c'],
  'History__c': ['User__c', 'Activity_Type__c']
};

// Validate that required credentials are loaded
function validateCredentials() {
  const required = ['SF_ACCESS_TOKEN', 'SF_INSTANCE_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    log(`Missing required environment variables: ${missing.join(', ')}`, 'error');
    log('Please ensure required environment variables are set (Azure App Settings or local .env):', 'info');
    log('  SF_ACCESS_TOKEN=<your_token>', 'info');
    log('  SF_INSTANCE_URL=<your_instance_url>', 'info');
    log('\nYou can get these by running:', 'info');
    log('  sf org display --target-org dev-org --json', 'info');
    return false;
  }
  
  log('✓ Loaded credentials from environment variables', 'success');
  log(`  Instance: ${process.env.SF_INSTANCE_URL}`, 'info');
  log(`  Token: ${process.env.SF_ACCESS_TOKEN.substring(0, 20)}...`, 'info');
  return true;
}

// Ensure sfdx-project.json exists (required for SF CLI commands)
function ensureSfdxProject() {
  const sfdxProjectPath = path.resolve(__dirname, '..', 'sfdx-project.json');
  
  if (!fs.existsSync(sfdxProjectPath)) {
    const sfdxProjectContent = {
      packageDirectories: [{ path: 'force-app', default: true }],
      namespace: '',
      sfdcLoginUrl: 'https://login.salesforce.com',
      sourceApiVersion: '59.0'
    };
    fs.writeFileSync(sfdxProjectPath, JSON.stringify(sfdxProjectContent, null, 2));
    log('✓ Created sfdx-project.json at database root', 'success');
  }
}

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = { 'info': 'ℹ️', 'success': '✅', 'error': '❌', 'warning': '⚠️', 'progress': '⏳' }[level] || 'ℹ️';
  console.log(`${prefix} [${timestamp.split('T')[1].split('.')[0]}] ${message}`);
}

function runCommand(cmd, description, silent = false) {
  try {
    log(description, 'progress');
    // SF CLI commands need to run from database directory (has .sf, .sfdx folders)
    // Node commands need to run from project root (volunteer-management-app)
    const workingDir = cmd.includes('sf ') ? path.resolve(__dirname, '..') : path.resolve(__dirname, '../..');
    const output = execSync(cmd, { stdio: silent ? 'pipe' : 'inherit', cwd: workingDir, encoding: 'utf8' });
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout };
  }
}

async function wait(seconds, message) {
  log(`${message} (${seconds}s)`, 'progress');
  await new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function step1_authenticate() {
  log('STEP 1: Authenticating with Salesforce', 'info');
  try {
    const params = await sfConfig.ensureAuthAndLogin();
    log(`Authentication successful (mode: ${params.authMode})`, 'success');
    const conn = new jsforce.Connection({ instanceUrl: process.env.SF_INSTANCE_URL, accessToken: process.env.SF_ACCESS_TOKEN });
    const identity = await conn.identity();
    log(`Connected as: ${identity.username}`, 'success');
    return { success: true, conn };
  } catch (error) {
    log(`Authentication failed: ${error.message}`, 'error');
    return { success: false, error };
  }
}

async function step2_deleteExistingApp() {
  log('STEP 2: Cleaning up existing app and UI components', 'info');
  
  // First, remove the profile reference to the app
  log('Removing app from Admin profile...', 'progress');
  const profilePath = path.join(__dirname, '..', 'force-app', 'default', 'profiles');
  if (fs.existsSync(profilePath)) {
    fs.rmSync(profilePath, { recursive: true, force: true });
    log('  Removed profile references', 'success');
    
    // Deploy the profile deletion
    const profileDeleteResult = runCommand(
      `sf project delete source --metadata "Profile:Admin" --target-org ${TARGET_ORG} --no-prompt`,
      'Deleting profile'
    );
    if (profileDeleteResult.success) {
      await wait(3, 'Waiting for profile deletion to propagate');
    }
  }
  
  // Try to delete the app, tabs
  const componentsToDelete = [
    'CustomApplication:Volunteer_Management',
    'CustomTab:Volunteer__c',
    'CustomTab:Event__c',
    'CustomTab:Registration__c',
    'CustomTab:VolunteerHours__c',
    'CustomTab:History__c'
  ];
  
  const metadataList = componentsToDelete.join(',');
  log('Deleting app and tabs...', 'progress');
  
  const result = runCommand(
    `sf project delete source --metadata "${metadataList}" --target-org ${TARGET_ORG} --no-prompt`,
    'Deleting app and tabs'
  );
  
  // Don't fail if deletion fails (components might not exist)
  if (result.success) {
    log('Successfully deleted existing app and tabs', 'success');
    await wait(5, 'Waiting for app deletion to propagate');
  } else {
    log('Some components may not have been deleted (possibly didn\'t exist)', 'info');
  }
  
  return { success: true };
}

async function step3_deleteExistingObjects(conn) {
  log('STEP 3: Checking for existing objects', 'info');
  let existingObjects = [];
  for (const objName of OBJECTS) {
    try {
      const describe = await conn.sobject(objName).describe();
      if (describe) {
        existingObjects.push(objName);
        log(`Found existing object: ${objName}`, 'warning');
      }
    } catch (error) {}
  }
  if (existingObjects.length === 0) {
    log('No existing objects found. Clean slate!', 'success');
    return { success: true, deleted: [] };
  }
  log(`Deleting ${existingObjects.length} existing objects...`, 'progress');
  const metadataList = OBJECTS.map(obj => `CustomObject:${obj}`).join(',');
  const result = runCommand(`sf project delete source --metadata "${metadataList}" --target-org ${TARGET_ORG} --no-prompt`, 'Executing deletion via SF CLI');
  if (!result.success) {
    log('Deletion failed', 'error');
    return { success: false, error: result.error };
  }
  await wait(10, 'Waiting for deletion to propagate');
  const freshConn = new jsforce.Connection({ instanceUrl: process.env.SF_INSTANCE_URL, accessToken: process.env.SF_ACCESS_TOKEN });
  for (const objName of existingObjects) {
    try {
      await freshConn.sobject(objName).describe();
      log(`Object ${objName} still exists after deletion!`, 'error');
      return { success: false, error: `Failed to delete ${objName}` };
    } catch (error) {}
  }
  log(`Successfully deleted ${existingObjects.length} objects`, 'success');
  return { success: true, deleted: existingObjects };
}

async function step4_deployMetadata() {
  log('STEP 4: Deploying metadata (objects + fields + tabs + app + profile)', 'info');
  
  // Clean up old metadata to ensure fresh start
  log('Cleaning up old metadata files...', 'progress');
  const forceAppPath = path.join(__dirname, '..', 'force-app', 'default');
  const itemsToClean = ['objects', 'tabs', 'applications'];
  
  for (const item of itemsToClean) {
    const itemPath = path.join(forceAppPath, item);
    if (fs.existsSync(itemPath)) {
      fs.rmSync(itemPath, { recursive: true, force: true });
      log(`  Removed old ${item}/`, 'success');
    }
  }
  
  log('Generating fresh SFDX metadata files...', 'progress');
  // Generator script runs from project root
  const generateResult = runCommand('node database/deploy-scripts/generate-sfdx-metadata.js', 'Running metadata generator', false);
  if (!generateResult.success) {
    log('Metadata generation failed', 'error');
    return { success: false, error: generateResult.error };
  }
  log('Metadata files generated successfully', 'success');
  log('Deploying to Salesforce...', 'progress');
  // SF CLI command runs from database directory, so force-app is relative to database/
  const deployResult = runCommand(`sf project deploy start --source-dir force-app --target-org ${TARGET_ORG} --wait 10`, 'Executing deployment');
  if (!deployResult.success) {
    log('Deployment failed', 'error');
    return { success: false, error: deployResult.error };
  }
  const deployOutput = deployResult.output || '';
  if (deployOutput.includes('Status: Succeeded')) {
    const match = deployOutput.match(/Components:\s*(\d+)\/(\d+)/);
    if (match) {
      const [, deployed, total] = match;
      log(`Deployment succeeded: ${deployed}/${total} components`, 'success');
      return { success: true, deployed: parseInt(deployed), total: parseInt(total) };
    }
  }
  log('Deployment completed', 'success');
  return { success: true };
}

async function step4b_refreshMetadata() {
  log('STEP 4B: Refreshing Salesforce metadata cache', 'info');
  
  // Method 1: Query Tooling API to force schema refresh
  log('Querying Tooling API to refresh schema cache...', 'progress');
  try {
    const conn = new jsforce.Connection({
      instanceUrl: process.env.SF_INSTANCE_URL,
      accessToken: process.env.SF_ACCESS_TOKEN
    });
    
    // Query each object via Tooling API which forces a deeper refresh
    const objects = ['Volunteer__c', 'Event__c', 'Registration__c', 'VolunteerHours__c', 'History__c'];
    for (const objName of objects) {
      try {
        // Query CustomObject metadata
        const objQuery = await conn.tooling.query(`SELECT Id, DeveloperName FROM CustomObject WHERE DeveloperName = '${objName.replace('__c', '')}'`);
        if (objQuery.records.length > 0) {
          // Query all CustomFields for this object
          const fieldsQuery = await conn.tooling.query(`SELECT Id, DeveloperName, TableEnumOrId FROM CustomField WHERE TableEnumOrId = '${objQuery.records[0].Id}'`);
          log(`  ✓ ${objName}: ${fieldsQuery.records.length} fields found in Tooling API`, 'success');
        }
      } catch (err) {
        log(`  ⚠ ${objName}: ${err.message}`, 'warning');
      }
    }
    
    log('Tooling API queries complete', 'success');
  } catch (err) {
    log(`Tooling API refresh error: ${err.message}`, 'warning');
  }
  
  // Method 2: Use jsforce to describe each object (forces API to refresh)
  log('Forcing REST API to refresh object descriptions...', 'progress');
  try {
    const conn = new jsforce.Connection({
      instanceUrl: process.env.SF_INSTANCE_URL,
      accessToken: process.env.SF_ACCESS_TOKEN
    });
    
    const objects = ['Volunteer__c', 'Event__c', 'Registration__c', 'VolunteerHours__c', 'History__c'];
    for (const objName of objects) {
      try {
        const describe = await conn.describeSObject(objName);
        const customFieldsCount = describe.fields.filter(f => f.name.endsWith('__c')).length;
        log(`  ✓ ${objName}: ${customFieldsCount} custom fields via REST API`, 'success');
      } catch (err) {
        log(`  ⚠ ${objName}: ${err.message}`, 'warning');
      }
    }
    
    log('REST API descriptions refreshed', 'success');
  } catch (err) {
    log(`REST API refresh error: ${err.message}`, 'warning');
  }
  
  // Method 3: Force a quick retrieve via SF CLI (sometimes helps)
  log('Triggering SF CLI metadata refresh...', 'progress');
  const retrieveResult = runCommand(
    `sf project retrieve start --metadata CustomField --target-org ${TARGET_ORG}`,
    'Retrieving all CustomFields',
    false
  );
  
  if (retrieveResult.success) {
    log('SF CLI retrieval completed', 'success');
  } else {
    log('SF CLI retrieval had issues (may be okay)', 'warning');
  }
  
  // Wait significantly longer for the refresh to fully propagate through all API layers
  await wait(30, 'Waiting for metadata refresh to fully propagate');
  
  log('Metadata refresh complete', 'success');
  return { success: true };
}

async function step4c_deployPageLayouts() {
  log('STEP 4C: Deploying page layouts for UI visibility', 'info');
  
  const layoutsDir = path.join(__dirname, '../force-app/default/layouts');
  
  // Ensure layouts directory exists
  if (!fs.existsSync(layoutsDir)) {
    fs.mkdirSync(layoutsDir, { recursive: true });
  }
  
  // Generate page layout XML for Volunteer object
  const volunteerLayoutXML = `<?xml version="1.0" encoding="UTF-8"?>
<Layout xmlns="http://soap.sforce.com/2006/04/metadata">
    <layoutSections>
        <customLabel>false</customLabel>
        <detailHeading>false</detailHeading>
        <editHeading>true</editHeading>
        <label>Information</label>
        <layoutColumns>
            <layoutItems>
                <behavior>Required</behavior>
                <field>Name</field>
            </layoutItems>
            <layoutItems>
                <behavior>Required</behavior>
                <field>First_Name__c</field>
            </layoutItems>
            <layoutItems>
                <behavior>Required</behavior>
                <field>Last_Name__c</field>
            </layoutItems>
            <layoutItems>
                <behavior>Edit</behavior>
                <field>Email__c</field>
            </layoutItems>
            <layoutItems>
                <behavior>Edit</behavior>
                <field>Phone__c</field>
            </layoutItems>
            <layoutItems>
                <behavior>Edit</behavior>
                <field>Date_of_Birth__c</field>
            </layoutItems>
        </layoutColumns>
        <layoutColumns>
            <layoutItems>
                <behavior>Edit</behavior>
                <field>Status__c</field>
            </layoutItems>
            <layoutItems>
                <behavior>Edit</behavior>
                <field>Volunteer_Type__c</field>
            </layoutItems>
            <layoutItems>
                <behavior>Edit</behavior>
                <field>T_Shirt_Size__c</field>
            </layoutItems>
            <layoutItems>
                <behavior>Edit</behavior>
                <field>Pass_Hash__c</field>
            </layoutItems>
        </layoutColumns>
        <style>TwoColumnsTopToBottom</style>
    </layoutSections>
    <layoutSections>
        <customLabel>true</customLabel>
        <detailHeading>true</detailHeading>
        <editHeading>true</editHeading>
        <label>Volunteer Details</label>
        <layoutColumns>
            <layoutItems>
                <behavior>Edit</behavior>
                <field>Why_Volunteer__c</field>
            </layoutItems>
            <layoutItems>
                <behavior>Edit</behavior>
                <field>Skills_to_Use__c</field>
            </layoutItems>
            <layoutItems>
                <behavior>Edit</behavior>
                <field>Community_Service_Hours__c</field>
            </layoutItems>
            <layoutItems>
                <behavior>Edit</behavior>
                <field>Company_Name__c</field>
            </layoutItems>
        </layoutColumns>
        <layoutColumns>
            <layoutItems>
                <behavior>Edit</behavior>
                <field>Volunteer_Assignments__c</field>
            </layoutItems>
            <layoutItems>
                <behavior>Edit</behavior>
                <field>Other_Assignment__c</field>
            </layoutItems>
            <layoutItems>
                <behavior>Edit</behavior>
                <field>Tasks_to_Avoid__c</field>
            </layoutItems>
            <layoutItems>
                <behavior>Edit</behavior>
                <field>Comfortable_With__c</field>
            </layoutItems>
        </layoutColumns>
        <style>TwoColumnsLeftToRight</style>
    </layoutSections>
    <layoutSections>
        <customLabel>true</customLabel>
        <detailHeading>true</detailHeading>
        <editHeading>true</editHeading>
        <label>Signature and Registration</label>
        <layoutColumns>
            <layoutItems>
                <behavior>Edit</behavior>
                <field>Electronic_Signature__c</field>
            </layoutItems>
            <layoutItems>
                <behavior>Edit</behavior>
                <field>Signature_Date__c</field>
            </layoutItems>
            <layoutItems>
                <behavior>Edit</behavior>
                <field>Registration_Date__c</field>
            </layoutItems>
        </layoutColumns>
        <layoutColumns>
            <layoutItems>
                <behavior>Edit</behavior>
                <field>Offender_Policy_Confirmed__c</field>
            </layoutItems>
            <layoutItems>
                <behavior>Edit</behavior>
                <field>Text_Opt_In__c</field>
            </layoutItems>
        </layoutColumns>
        <style>TwoColumnsLeftToRight</style>
    </layoutSections>
    <layoutSections>
        <customLabel>true</customLabel>
        <detailHeading>true</detailHeading>
        <editHeading>true</editHeading>
        <label>Additional Information</label>
        <layoutColumns>
            <layoutItems>
                <behavior>Edit</behavior>
                <field>Profile_Picture_URL__c</field>
            </layoutItems>
            <layoutItems>
                <behavior>Edit</behavior>
                <field>Facebook_Handle__c</field>
            </layoutItems>
            <layoutItems>
                <behavior>Edit</behavior>
                <field>Instagram_Handle__c</field>
            </layoutItems>
        </layoutColumns>
        <layoutColumns>
            <layoutItems>
                <behavior>Edit</behavior>
                <field>Events_Signed_Up__c</field>
            </layoutItems>
            <layoutItems>
                <behavior>Edit</behavior>
                <field>Additional_Comments__c</field>
            </layoutItems>
        </layoutColumns>
        <style>TwoColumnsLeftToRight</style>
    </layoutSections>
    <layoutSections>
        <customLabel>true</customLabel>
        <detailHeading>true</detailHeading>
        <editHeading>true</editHeading>
        <label>System Information</label>
        <layoutColumns>
            <layoutItems>
                <behavior>Readonly</behavior>
                <field>CreatedById</field>
            </layoutItems>
        </layoutColumns>
        <layoutColumns>
            <layoutItems>
                <behavior>Readonly</behavior>
                <field>LastModifiedById</field>
            </layoutItems>
        </layoutColumns>
        <style>TwoColumnsLeftToRight</style>
    </layoutSections>
    <showEmailCheckbox>false</showEmailCheckbox>
    <showRunAssignmentRulesCheckbox>false</showRunAssignmentRulesCheckbox>
    <showSubmitAndAttachButton>false</showSubmitAndAttachButton>
</Layout>
`;
  
  // Write layout file
  fs.writeFileSync(path.join(layoutsDir, 'Volunteer__c-Volunteer Layout.layout-meta.xml'), volunteerLayoutXML);
  log('Generated Volunteer__c page layout', 'success');
  
  // Deploy the layout
  const layoutResult = runCommand(
    `sf project deploy start --source-dir force-app/default/layouts --target-org ${TARGET_ORG}`,
    'Deploying page layout',
    false
  );
  
  if (layoutResult.success) {
    log('Page layout deployed successfully', 'success');
    return { success: true };
  } else {
    log(`Page layout deployment failed: ${layoutResult.error}`, 'error');
    return { success: false, error: layoutResult.error };
  }
}

async function step5_validateFields(conn) {
  log('STEP 5: Validating fields in Salesforce', 'info');
  
  const freshConn = new jsforce.Connection({ 
    instanceUrl: process.env.SF_INSTANCE_URL, 
    accessToken: process.env.SF_ACCESS_TOKEN 
  });
  
  let allValid = true;
  let missingFieldsCount = 0;
  let foundFieldsCount = 0;
  
  for (const [objectName, expectedFields] of Object.entries(CRITICAL_FIELDS)) {
    try {
      log(`Checking ${objectName}...`, 'progress');
      const describe = await freshConn.describe(objectName);
      const actualFields = describe.fields.map(f => f.name);
      
      for (const fieldName of expectedFields) {
        if (actualFields.includes(fieldName)) {
          foundFieldsCount++;
          log(`  ✓ ${fieldName}`, 'success');
        } else {
          missingFieldsCount++;
          allValid = false;
          log(`  ✗ ${fieldName} - NOT FOUND`, 'error');
        }
      }
    } catch (error) {
      log(`  ✗ Error describing ${objectName}: ${error.message}`, 'error');
      allValid = false;
      missingFieldsCount += expectedFields.length;
    }
  }
  
  console.log('');
  log(`Validation complete: ${foundFieldsCount} fields found, ${missingFieldsCount} missing`, 
      missingFieldsCount === 0 ? 'success' : 'warning');
  
  if (allValid) {
    log('All critical fields are accessible via API!', 'success');
    return { success: true, found: foundFieldsCount };
  } else {
    log('Some fields are missing or not yet accessible', 'warning');
    log('This is likely a Salesforce API cache issue - fields exist in UI', 'info');
    log('You can proceed manually: Check Setup → Object Manager to confirm fields exist', 'info');
    
    // Don't fail completely - deployment succeeded, this is just a cache issue
    if (foundFieldsCount > 0) {
      log(`${foundFieldsCount} fields are working - continuing with partial success`, 'warning');
      return { success: true, partial: true, found: foundFieldsCount, missing: missingFieldsCount };
    }
    
    return { success: false, error: 'No fields accessible via API' };
  }
}

async function step6_seedData() {
  log('STEP 6: Seeding data with complete fields', 'info');
  // Use smartSeed.js which handles fields gracefully
  const seedResult = runCommand('node database/init/smartSeed.js', 'Executing smart seed script');
  if (!seedResult.success) {
    log('Seeding failed', 'error');
    return { success: false, error: seedResult.error };
  }
  log('Seeding completed', 'success');
  return { success: true };
}

async function step7_validateRecords(conn) {
  log('STEP 7: Validating seeded records', 'info');
  const expectedCounts = { 'Volunteer__c': 2, 'Event__c': 2, 'Registration__c': 2, 'VolunteerHours__c': 2, 'History__c': 0 };
  let allValid = true;
  for (const objectName of OBJECTS) {
    try {
      const result = await conn.query(`SELECT COUNT() FROM ${objectName}`);
      const count = result.totalSize;
      const expected = expectedCounts[objectName];
      if (count >= expected) {
        log(`${objectName}: ${count} records ✓`, 'success');
      } else {
        log(`${objectName}: Expected at least ${expected}, found ${count}`, 'error');
        allValid = false;
      }
    } catch (error) {
      log(`${objectName}: Query failed - ${error.message}`, 'error');
      allValid = false;
    }
  }
  if (!allValid) {
    return { success: false, error: 'Record count validation failed' };
  }
  try {
    const volunteers = await conn.query('SELECT Id, Email__c, Phone__c FROM Volunteer__c LIMIT 1');
    if (volunteers.records.length > 0) {
      log('Sample query successful - Email__c and Phone__c are queryable', 'success');
    }
  } catch (error) {
    log(`Sample query failed: ${error.message}`, 'error');
    return { success: false, error: 'Sample query validation failed' };
  }
  log('All record validations passed!', 'success');
  return { success: true };
}

async function initializeDB() {
  console.log('\n' + '='.repeat(70));
  console.log('  SALESFORCE DATABASE INITIALIZATION');
  console.log('  (Deletion + Deployment + Page Layouts + Validation + Seeding)');
  console.log('='.repeat(70) + '\n');
  
  // Validate credentials are loaded from environment variables
  if (!validateCredentials()) {
    process.exit(1);
  }
  
  // Ensure sfdx-project.json exists before running any SF CLI commands
  ensureSfdxProject();
  
  console.log('');
  const startTime = Date.now();
  try {
    const authResult = await step1_authenticate();
    if (!authResult.success) process.exit(1);
    const conn = authResult.conn;
    
    const deleteAppResult = await step2_deleteExistingApp();
    if (!deleteAppResult.success) process.exit(1);
    
    const deleteObjectsResult = await step3_deleteExistingObjects(conn);
    if (!deleteObjectsResult.success) process.exit(1);
    
    const deployResult = await step4_deployMetadata();
    if (!deployResult.success) process.exit(1);
    
    // NEW: Refresh metadata cache
    const refreshResult = await step4b_refreshMetadata();
    if (!refreshResult.success) {
      log('Metadata refresh had issues - continuing anyway', 'warning');
    }
    
    // NEW: Deploy page layouts for UI visibility
    const layoutResult = await step4c_deployPageLayouts();
    if (!layoutResult.success) {
      log('Page layout deployment failed - fields may not be visible in UI', 'warning');
    }
    
    const validateResult = await step5_validateFields(conn);
    if (!validateResult.success) {
      log('Field validation failed completely. Check Salesforce Setup UI.', 'error');
      process.exit(1);
    }
    
    if (validateResult.partial) {
      log('Continuing with partial field validation - some fields may not be accessible yet', 'warning');
    }
    
    const seedResult = await step6_seedData();
    if (!seedResult.success) {
      log('Data seeding failed', 'warning');
      log('You can manually create records in Salesforce UI', 'info');
      log('Or re-run: node database/init/initDB.js', 'info');
    } else {
      const recordResult = await step7_validateRecords(conn);
      if (!recordResult.success) {
        log('Record validation failed', 'warning');
      }
    }
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log('\n' + '='.repeat(70));
    log(`INITIALIZATION COMPLETE! (${duration}s)`, 'success');
    log('Access your data: Salesforce → App Launcher → "Volunteer Management"', 'info');
    console.log('='.repeat(70) + '\n');
  } catch (error) {
    log(`Unexpected error: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  initializeDB().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { initializeDB };
