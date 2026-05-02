#!/usr/bin/env node
/**
 * Alternative approach: Use Salesforce Tooling API to create fields
 * This bypasses the Metadata API issues we've been experiencing
 */

const jsforce = require('jsforce');

const sfConfig = require('../config/salesForceConfig');

// Import field definitions
const volunteerFields = require('../schemas/Volunteer');
const eventFields = require('../schemas/Event');
const registrationFields = require('../schemas/Registration');
const volunteerHoursFields = require('../schemas/VolunteerHours');
const historyFields = require('../schemas/History');

// Map our schema field types to Salesforce Tooling API types
function mapFieldType(field) {
  const typeMap = {
    'Text': 'Text',
    'LongTextArea': 'LongTextArea',
    'Email': 'Email',
    'Phone': 'Phone',
    'Date': 'Date',
    'DateTime': 'DateTime',
    'Number': 'Number',
    'Checkbox': 'Checkbox',
    'Picklist': 'Picklist',
    'Lookup': 'Lookup',
    'MasterDetail': 'MasterDetail'
  };
  return typeMap[field.type] || 'Text';
}

async function createFieldViaToolingAPI(conn, objectName, field) {
  const fieldType = mapFieldType(field);
  
  // Build the field definition for Tooling API
  const fieldDef = {
    FullName: `${objectName}.${field.fullName}`,
    Metadata: {
      type: fieldType,
      label: field.label,
      required: field.required || false,
      unique: false,
      externalId: false
    }
  };

  // Add type-specific properties
  if (fieldType === 'Text' && field.length) {
    fieldDef.Metadata.length = field.length;
  }
  
  if (fieldType === 'LongTextArea') {
    fieldDef.Metadata.length = field.length || 32768;
    fieldDef.Metadata.visibleLines = field.visibleLines || 5;
  }
  
  if (fieldType === 'Number') {
    fieldDef.Metadata.precision = field.precision || 18;
    fieldDef.Metadata.scale = field.scale || 0;
  }
  
  if (fieldType === 'Picklist' && field.valueSet) {
    fieldDef.Metadata.valueSet = {
      restricted: true,
      valueSetDefinition: {
        sorted: false,
        value: field.valueSet.valueSetDefinition.value.map(v => ({
          fullName: v.fullName,
          default: false,
          label: v.fullName
        }))
      }
    };
  }
  
  if ((fieldType === 'Lookup' || fieldType === 'MasterDetail') && field.referenceTo) {
    fieldDef.Metadata.referenceTo = field.referenceTo;
    fieldDef.Metadata.relationshipLabel = field.relationshipLabel || field.label;
    fieldDef.Metadata.relationshipName = field.relationshipName || field.fullName.replace('__c', '__r');
  }
  
  if (field.defaultValue !== undefined) {
    fieldDef.Metadata.defaultValue = field.defaultValue;
  }

  try {
    // Use Tooling API to create the field
    const result = await conn.tooling.sobject('CustomField').create(fieldDef);
    
    if (result.success) {
      console.log(`✅ Created ${objectName}.${field.fullName}`);
      return { success: true, field: field.fullName };
    } else {
      console.error(`❌ Failed ${objectName}.${field.fullName}:`, result.errors);
      return { success: false, field: field.fullName, errors: result.errors };
    }
  } catch (error) {
    console.error(`❌ Error creating ${objectName}.${field.fullName}:`, error.message);
    return { success: false, field: field.fullName, error: error.message };
  }
}

async function createFieldsForObject(conn, objectName, fields) {
  console.log(`\n📦 Creating fields for ${objectName}...`);
  const results = [];
  
  // Create fields one at a time to avoid rate limits
  for (const field of fields) {
    const result = await createFieldViaToolingAPI(conn, objectName, field);
    results.push(result);
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  const succeeded = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\n${objectName}: ${succeeded} succeeded, ${failed} failed`);
  return results;
}

async function waitForField(conn, objectName, fieldName, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const describe = await conn.sobject(objectName).describe();
      const field = describe.fields.find(f => f.name === fieldName);
      if (field) {
        return true;
      }
    } catch (error) {
      // Ignore
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  return false;
}

async function main() {
  console.log('🚀 Salesforce Field Creation via Tooling API\n');
  console.log('═══════════════════════════════════════════\n');
  
  try {
    // Authenticate
    console.log('🔐 Authenticating...');
    const params = await sfConfig.ensureAuthAndLogin();
    const conn = new jsforce.Connection({
      instanceUrl: process.env.SF_INSTANCE_URL,
      accessToken: process.env.SF_ACCESS_TOKEN
    });
    console.log('✅ Authenticated\n');
    
    // Create fields for each object
    const allResults = {};
    
    allResults.Volunteer__c = await createFieldsForObject(conn, 'Volunteer__c', volunteerFields);
    allResults.Event__c = await createFieldsForObject(conn, 'Event__c', eventFields);
    allResults.Registration__c = await createFieldsForObject(conn, 'Registration__c', registrationFields);
    allResults.VolunteerHours__c = await createFieldsForObject(conn, 'VolunteerHours__c', volunteerHoursFields);
    allResults.History__c = await createFieldsForObject(conn, 'History__c', historyFields);
    
    // Summary
    console.log('\n\n📊 SUMMARY');
    console.log('═══════════════════════════════════════════\n');
    
    let totalSuccess = 0;
    let totalFailed = 0;
    
    for (const [objectName, results] of Object.entries(allResults)) {
      const succeeded = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      totalSuccess += succeeded;
      totalFailed += failed;
      console.log(`${objectName}: ${succeeded}/${results.length} fields created`);
    }
    
    console.log(`\nTotal: ${totalSuccess} succeeded, ${totalFailed} failed`);
    
    if (totalFailed > 0) {
      console.log('\n⚠️  Some fields failed to create. Check errors above.');
      process.exit(1);
    }
    
    // Test a critical field
    console.log('\n🔍 Validating Email__c field...');
    const emailExists = await waitForField(conn, 'Volunteer__c', 'Email__c', 15);
    
    if (emailExists) {
      console.log('✅ Email__c field is queryable!');
      console.log('\n✅ All fields created successfully via Tooling API!');
      process.exit(0);
    } else {
      console.log('⚠️  Email__c field created but not yet queryable. May need more time.');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createFieldViaToolingAPI, createFieldsForObject };
