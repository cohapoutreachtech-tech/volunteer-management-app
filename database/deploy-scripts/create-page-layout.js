/**
 * Add all custom fields to the Volunteer page layout
 * This ensures fields show up in the Salesforce UI
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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
console.log('✓ Generated Volunteer__c page layout');

// Deploy the layout
console.log('\nDeploying page layout...');
try {
  execSync('sf project deploy start --source-dir force-app/default/layouts', {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit'
  });
  console.log('\n✅ Page layout deployed successfully!');
  console.log('\nNow refresh your Salesforce page and all fields should be visible.');
} catch (err) {
  console.error('❌ Deployment failed:', err.message);
}
