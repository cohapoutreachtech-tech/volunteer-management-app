#!/usr/bin/env node

/**
 * CI/CD Seeding Script for Salesforce
 * 
 * This script seeds initial data using the Salesforce CLI (sf)
 * It's designed to work in GitHub Actions environment
 */

const { execSync } = require('child_process');
const crypto = require('crypto');

// Use SHA-256 to match Salesforce Apex PasswordUtils
const hashPassword = (plain) => {
    return crypto.createHash('sha256').update(plain).digest('hex');
};

console.log('\n🌱 Seeding database via Salesforce CLI...\n');
console.log('═'.repeat(70));

// Helper function to execute SF CLI commands
function sfExec(command, silent = false) {
    try {
        const output = execSync(command, { encoding: 'utf8' });
        if (!silent) console.log(output);
        return output;
    } catch (error) {
        console.error(`❌ Command failed: ${command}`);
        console.error(error.message);
        return null;
    }
}

// Check if volunteers already exist
console.log('\n🔍 Checking for existing data...\n');
const existingVolunteers = sfExec(
    'sf data query --query "SELECT Id, Email__c FROM Volunteer__c WHERE Email__c = \'admin@cohap.org\' LIMIT 1" --json',
    true
);

if (existingVolunteers) {
    const result = JSON.parse(existingVolunteers);
    if (result.result && result.result.records && result.result.records.length > 0) {
        console.log('✅ Data already exists. Skipping seed...');
        console.log('─'.repeat(70) + '\n');
        process.exit(0);
    }
}

console.log('📝 Creating seed data...\n');

// Create Volunteers
console.log('👥 Creating Volunteers...\n');

const volunteers = [
    {
        First_Name__c: 'Administrator',
        Last_Name__c: 'COHAP',
        Email__c: 'admin@cohap.org',
        Phone__c: '260-555-0001',
        Date_of_Birth__c: '1980-01-01',
        Volunteer_Type__c: 'Administrator',
        T_Shirt_Size__c: 'L',
        Why_Volunteer__c: 'Lead admin.',
        Community_Service_Hours__c: 'Yes',
        Offender_Policy_Confirmed__c: true,
        Electronic_Signature__c: 'Admin COHAP',
        Signature_Date__c: new Date().toISOString().split('T')[0],
        Registration_Date__c: new Date().toISOString(),
        Status__c: 'Active',
        Pass_Hash__c: hashPassword('admin123')
    },
    {
        First_Name__c: 'John',
        Last_Name__c: 'Volunteer',
        Email__c: 'volunteer@cohap.org',
        Phone__c: '260-555-0002',
        Date_of_Birth__c: '2000-05-15',
        Volunteer_Type__c: 'Individual',
        T_Shirt_Size__c: 'M',
        Why_Volunteer__c: 'I want to help.',
        Community_Service_Hours__c: 'Yes',
        Offender_Policy_Confirmed__c: true,
        Electronic_Signature__c: 'John Volunteer',
        Signature_Date__c: new Date().toISOString().split('T')[0],
        Registration_Date__c: new Date().toISOString(),
        Status__c: 'Active',
        Pass_Hash__c: hashPassword('volunteer123')
    }
];

const volunteerIds = [];

for (const vol of volunteers) {
    const fields = Object.entries(vol)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');
    
    const result = sfExec(
        `sf data create record --sobject Volunteer__c --values "${fields}" --json`,
        true
    );
    
    if (result) {
        const parsed = JSON.parse(result);
        if (parsed.result && parsed.result.id) {
            volunteerIds.push(parsed.result.id);
            console.log(`✅ Created: ${vol.First_Name__c} ${vol.Last_Name__c} (${parsed.result.id})`);
        }
    }
}

// Create Events
console.log('\n📅 Creating Events...\n');

const futureDate1 = new Date();
futureDate1.setDate(futureDate1.getDate() + 30);
const futureDate2 = new Date();
futureDate2.setDate(futureDate2.getDate() + 45);

const events = [
    {
        Title__c: 'COHAP Community Cleanup',
        Event_Date__c: futureDate1.toISOString().split('T')[0],
        Event_Time__c: '10:00 AM',
        Location__c: 'Central Park',
        Description__c: 'COHAP organized community park cleanup',
        Created_Date__c: new Date().toISOString(),
        Event_Status__c: 'Published',
        Max_Volunteers__c: 20
    },
    {
        Title__c: 'COHAP Food Drive',
        Event_Date__c: futureDate2.toISOString().split('T')[0],
        Event_Time__c: '2:00 PM',
        Location__c: 'COHAP Community Center',
        Description__c: 'Monthly food donation drive',
        Created_Date__c: new Date().toISOString(),
        Event_Status__c: 'Published',
        Max_Volunteers__c: 15
    }
];

const eventIds = [];

for (const evt of events) {
    const fields = Object.entries(evt)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');
    
    const result = sfExec(
        `sf data create record --sobject Event__c --values "${fields}" --json`,
        true
    );
    
    if (result) {
        const parsed = JSON.parse(result);
        if (parsed.result && parsed.result.id) {
            eventIds.push(parsed.result.id);
            console.log(`✅ Created: ${evt.Title__c} (${parsed.result.id})`);
        }
    }
}

// Create Registrations (if we have volunteers and events)
if (volunteerIds.length > 0 && eventIds.length > 0) {
    console.log('\n📝 Creating Registrations...\n');
    
    const registration = {
        Volunteer__c: volunteerIds[0],
        Event__c: eventIds[0],
        Registration_Date__c: new Date().toISOString(),
        Registration_Status__c: 'Confirmed',
        Attended__c: false,
        Notes__c: 'Initial registration from seed script'
    };
    
    const fields = Object.entries(registration)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');
    
    const result = sfExec(
        `sf data create record --sobject Registration__c --values "${fields}" --json`,
        true
    );
    
    if (result) {
        const parsed = JSON.parse(result);
        if (parsed.result && parsed.result.id) {
            console.log(`✅ Created: Registration for ${volunteers[0].First_Name__c} (${parsed.result.id})`);
        }
    }
}

// Create Volunteer Hours (if we have volunteers and events)
if (volunteerIds.length > 0 && eventIds.length > 0) {
    console.log('\n⏱️  Creating Volunteer Hours...\n');
    
    const hours = {
        Volunteer__c: volunteerIds[0],
        Event__c: eventIds[0],
        Shift_Date__c: new Date().toISOString().split('T')[0],
        Total_Hours__c: 3.0,
        Approval_Status__c: 'Pending',
        Submitted_Date__c: new Date().toISOString(),
        Notes__c: 'Initial hours from seed script'
    };
    
    const fields = Object.entries(hours)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');
    
    const result = sfExec(
        `sf data create record --sobject VolunteerHours__c --values "${fields}" --json`,
        true
    );
    
    if (result) {
        const parsed = JSON.parse(result);
        if (parsed.result && parsed.result.id) {
            console.log(`✅ Created: Volunteer Hours for ${volunteers[0].First_Name__c} (${parsed.result.id})`);
        }
    }
}

console.log('\n═'.repeat(70));
console.log('✅ Database seeding complete!\n');
console.log(`Created ${volunteerIds.length} volunteers`);
console.log(`Created ${eventIds.length} events`);
console.log('\n📊 You can now test the API with:');
console.log('   Email: admin@cohap.org');
console.log('   Password: admin123\n');
