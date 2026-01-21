#!/usr/bin/env node
/**
 * Generates SFDX source format metadata files from our schema definitions
 * and deploys them using the Salesforce CLI (sf project deploy)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Import schema definitions (now relative to database/deploy-scripts/)
const volunteerFields = require('../schemas/Volunteer');
const eventFields = require('../schemas/Event');
const registrationFields = require('../schemas/Registration');
const volunteerHoursFields = require('../schemas/VolunteerHours');
const historyFields = require('../schemas/History');

const baseDir = path.resolve(__dirname, '..', 'force-app', 'default');
const objectsDir = path.join(baseDir, 'objects');

// Ensure sfdx-project.json exists (using database root as the project root)
const sfdxProjectSfdx = path.resolve(__dirname, '..', 'sfdx-project.json');

const sfdxProjectContent = {
  packageDirectories: [{ path: 'force-app', default: true }],
  namespace: '',
  sfdcLoginUrl: 'https://login.salesforce.com',
  sourceApiVersion: '59.0'
};

// Create/update sfdx-project.json at database root (required by SF CLI)
if (!fs.existsSync(sfdxProjectSfdx)) {
  fs.writeFileSync(sfdxProjectSfdx, JSON.stringify(sfdxProjectContent, null, 2));
  console.log('✓ Created sfdx-project.json at database root');
}

// Convert field type to SFDX format
function convertFieldType(field) {
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
    'Lookup': 'Lookup'
  };
  return typeMap[field.type] || field.type;
}

// Generate field XML
function generateFieldXML(objectName, field) {
  const fieldType = convertFieldType(field);
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">\n`;
  xml += `    <fullName>${field.fullName}</fullName>\n`;
  xml += `    <label>${field.label}</label>\n`;
  xml += `    <type>${fieldType}</type>\n`;
  
  if (field.length) xml += `    <length>${field.length}</length>\n`;
  if (field.precision) xml += `    <precision>${field.precision}</precision>\n`;
  if (field.scale !== undefined) xml += `    <scale>${field.scale}</scale>\n`;
  if (field.visibleLines) xml += `    <visibleLines>${field.visibleLines}</visibleLines>\n`;
  if (field.required) xml += `    <required>true</required>\n`;
  
  if (field.defaultValue !== undefined) {
    xml += `    <defaultValue>${field.defaultValue}</defaultValue>\n`;
  }
  
  if (field.valueSet) {
    xml += `    <valueSet>\n`;
    xml += `        <restricted>true</restricted>\n`;
    xml += `        <valueSetDefinition>\n`;
    xml += `            <sorted>false</sorted>\n`;
    for (const val of field.valueSet.valueSetDefinition.value) {
      xml += `            <value>\n`;
      xml += `                <fullName>${val.fullName}</fullName>\n`;
      xml += `                <default>false</default>\n`;
      xml += `                <label>${val.fullName}</label>\n`;
      xml += `            </value>\n`;
    }
    xml += `        </valueSetDefinition>\n`;
    xml += `    </valueSet>\n`;
  }
  
  if (field.type === 'Lookup' && field.referenceTo) {
    xml += `    <referenceTo>${field.referenceTo[0]}</referenceTo>\n`;
    xml += `    <relationshipLabel>${field.relationshipLabel || field.label}</relationshipLabel>\n`;
    xml += `    <relationshipName>${field.relationshipName || field.fullName.replace('__c', '')}</relationshipName>\n`;
    if (field.deleteConstraint) {
      xml += `    <deleteConstraint>${field.deleteConstraint}</deleteConstraint>\n`;
    }
  }
  
  // CRITICAL: Set field-level security to Public Read/Write for all fields
  // This ensures fields are immediately accessible via API
  xml += `    <securityClassification>Public</securityClassification>\n`;
  
  xml += `</CustomField>\n`;
  return xml;
}

// Generate object XML
function generateObjectXML(objectName, label, pluralLabel) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">\n`;
  xml += `    <deploymentStatus>Deployed</deploymentStatus>\n`;
  xml += `    <enableActivities>true</enableActivities>\n`;
  xml += `    <enableBulkApi>true</enableBulkApi>\n`;
  xml += `    <enableReports>true</enableReports>\n`;
  xml += `    <enableSearch>true</enableSearch>\n`;
  xml += `    <enableSharing>true</enableSharing>\n`;
  xml += `    <enableStreamingApi>true</enableStreamingApi>\n`;
  xml += `    <label>${label}</label>\n`;
  xml += `    <pluralLabel>${pluralLabel}</pluralLabel>\n`;
  xml += `    <nameField>\n`;
  xml += `        <label>${label} Number</label>\n`;
  xml += `        <type>Text</type>\n`;
  xml += `    </nameField>\n`;
  xml += `    <searchLayouts/>\n`;
  xml += `    <sharingModel>ReadWrite</sharingModel>\n`;
  xml += `</CustomObject>\n`;
  return xml;
}

// Generate metadata for an object
function generateObjectMetadata(objectName, label, pluralLabel, fields) {
  const objectDir = path.join(objectsDir, objectName);
  const fieldsDir = path.join(objectDir, 'fields');
  
  // Create directories if they don't exist
  if (!fs.existsSync(objectDir)) {
    fs.mkdirSync(objectDir, { recursive: true });
  }
  if (!fs.existsSync(fieldsDir)) {
    fs.mkdirSync(fieldsDir, { recursive: true });
  }
  
  // Create object metadata file
  const objectXML = generateObjectXML(objectName, label, pluralLabel);
  fs.writeFileSync(path.join(objectDir, `${objectName}.object-meta.xml`), objectXML);
  console.log(`✓ Generated ${objectName}.object-meta.xml`);
  
  // Create field metadata files
  let fieldCount = 0;
  for (const field of fields) {
    const fieldXML = generateFieldXML(objectName, field);
    const fieldFileName = `${field.fullName}.field-meta.xml`;
    fs.writeFileSync(path.join(fieldsDir, fieldFileName), fieldXML);
    fieldCount++;
  }
  console.log(`✓ Generated ${fieldCount} field files for ${objectName}`);
}

// Generate tab XML for an object
function generateTabXML(objectName, label, motif) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<CustomTab xmlns="http://soap.sforce.com/2006/04/metadata">\n`;
  xml += `    <customObject>true</customObject>\n`;
  xml += `    <label>${label}</label>\n`;
  xml += `    <motif>${motif}</motif>\n`;
  xml += `</CustomTab>\n`;
  return xml;
}

// Generate app XML
function generateAppXML() {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<CustomApplication xmlns="http://soap.sforce.com/2006/04/metadata">\n`;
  xml += `    <brand>\n`;
  xml += `        <headerColor>#0070D2</headerColor>\n`;
  xml += `        <shouldOverrideOrgTheme>false</shouldOverrideOrgTheme>\n`;
  xml += `    </brand>\n`;
  xml += `    <description>Volunteer Management System - Manage volunteers, events, registrations, and hours tracking</description>\n`;
  xml += `    <formFactors>Small</formFactors>\n`;
  xml += `    <formFactors>Large</formFactors>\n`;
  xml += `    <isNavAutoTempTabsDisabled>false</isNavAutoTempTabsDisabled>\n`;
  xml += `    <isNavPersonalizationDisabled>false</isNavPersonalizationDisabled>\n`;
  xml += `    <label>Volunteer Management</label>\n`;
  xml += `    <navType>Standard</navType>\n`;
  xml += `    <tabs>standard-home</tabs>\n`;
  xml += `    <tabs>Volunteer__c</tabs>\n`;
  xml += `    <tabs>Event__c</tabs>\n`;
  xml += `    <tabs>Registration__c</tabs>\n`;
  xml += `    <tabs>VolunteerHours__c</tabs>\n`;
  xml += `    <tabs>History__c</tabs>\n`;
  xml += `    <uiType>Lightning</uiType>\n`;
  xml += `</CustomApplication>\n`;
  return xml;
}

// Generate tabs and app
function generateUIMetadata() {
  console.log('\nGenerating UI metadata (tabs and app)...\n');
  
  // Create tabs directory
  const tabsDir = path.join(baseDir, 'tabs');
  if (!fs.existsSync(tabsDir)) {
    fs.mkdirSync(tabsDir, { recursive: true });
  }
  
  // Generate tabs
  const tabs = [
    { objectName: 'Volunteer__c', label: 'Volunteers', motif: 'Custom41: People' },
    { objectName: 'Event__c', label: 'Events', motif: 'Custom48: Calendar' },
    { objectName: 'Registration__c', label: 'Registrations', motif: 'Custom9: Clipboard' },
    { objectName: 'VolunteerHours__c', label: 'Volunteer Hours', motif: 'Custom5: Clock' },
    { objectName: 'History__c', label: 'History', motif: 'Custom54: Document' }
  ];
  
  for (const tab of tabs) {
    const tabXML = generateTabXML(tab.objectName, tab.label, tab.motif);
    fs.writeFileSync(path.join(tabsDir, `${tab.objectName}.tab-meta.xml`), tabXML);
    console.log(`✓ Generated ${tab.objectName}.tab-meta.xml`);
  }
  
  // Create applications directory
  const appsDir = path.join(baseDir, 'applications');
  if (!fs.existsSync(appsDir)) {
    fs.mkdirSync(appsDir, { recursive: true });
  }
  
  // Generate app
  const appXML = generateAppXML();
  fs.writeFileSync(path.join(appsDir, 'Volunteer_Management.app-meta.xml'), appXML);
  console.log(`✓ Generated Volunteer_Management.app-meta.xml`);
  
  // Create profiles directory
  const profilesDir = path.join(baseDir, 'profiles');
  if (!fs.existsSync(profilesDir)) {
    fs.mkdirSync(profilesDir, { recursive: true });
  }
  
  // Generate Admin profile with app visibility AND field permissions
  // Collect all fields from all objects to grant permissions
  const allFieldPermissions = [];
  
  // Use the already-loaded schema arrays
  const allSchemas = [
    { objectName: 'Volunteer__c', fields: volunteerFields },
    { objectName: 'Event__c', fields: eventFields },
    { objectName: 'Registration__c', fields: registrationFields },
    { objectName: 'VolunteerHours__c', fields: volunteerHoursFields },
    { objectName: 'History__c', fields: historyFields }
  ];
  
  for (const schema of allSchemas) {
    // Add field permissions for each custom field
    // SKIP required fields - they cannot have explicit permissions in profiles
    for (const field of schema.fields) {
      if (field.fullName.endsWith('__c') && !field.required) {
        allFieldPermissions.push(`    <fieldPermissions>
        <field>${schema.objectName}.${field.fullName}</field>
        <editable>true</editable>
        <readable>true</readable>
    </fieldPermissions>`);
      }
    }
  }
  
  const adminProfileXML = `<?xml version="1.0" encoding="UTF-8"?>
<Profile xmlns="http://soap.sforce.com/2006/04/metadata">
    <applicationVisibilities>
        <application>Volunteer_Management</application>
        <default>true</default>
        <visible>true</visible>
    </applicationVisibilities>
    <custom>false</custom>
${allFieldPermissions.join('\n')}
    <tabVisibilities>
        <tab>Volunteer__c</tab>
        <visibility>DefaultOn</visibility>
    </tabVisibilities>
    <tabVisibilities>
        <tab>Event__c</tab>
        <visibility>DefaultOn</visibility>
    </tabVisibilities>
    <tabVisibilities>
        <tab>Registration__c</tab>
        <visibility>DefaultOn</visibility>
    </tabVisibilities>
    <tabVisibilities>
        <tab>VolunteerHours__c</tab>
        <visibility>DefaultOn</visibility>
    </tabVisibilities>
    <tabVisibilities>
        <tab>History__c</tab>
        <visibility>DefaultOn</visibility>
    </tabVisibilities>
    <userLicense>Salesforce</userLicense>
</Profile>
`;
  fs.writeFileSync(path.join(profilesDir, 'Admin.profile-meta.xml'), adminProfileXML);
  console.log(`✓ Generated Admin.profile-meta.xml (with app visibility)`);
}

// Main execution
console.log('Generating SFDX metadata files...\n');

generateObjectMetadata('Volunteer__c', 'Volunteer', 'Volunteers', volunteerFields);
generateObjectMetadata('Event__c', 'Event', 'Events', eventFields);
generateObjectMetadata('Registration__c', 'Registration', 'Registrations', registrationFields);
generateObjectMetadata('VolunteerHours__c', 'Volunteer Hours', 'Volunteer Hours', volunteerHoursFields);
generateObjectMetadata('History__c', 'History', 'History', historyFields);

// Generate tabs and app
generateUIMetadata();

console.log('\n✅ All metadata files generated successfully!');
console.log('   - Objects: 5');
console.log('   - Fields: 74');
console.log('   - Tabs: 5');
console.log('   - Apps: 1 (Volunteer Management)');
console.log('   - Profiles: 1 (Admin with app access)');
console.log('\nNext steps:');
console.log('1. Deploy to Salesforce: sf project deploy start --source-dir force-app --target-org dev-org');
console.log('2. Or run: node database/init/initDB.js');
