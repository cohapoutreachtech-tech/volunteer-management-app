#!/usr/bin/env node

/**
 * Smart Seeding Script - Imports and Seeds Data from seedData.js
 * 
 * This script creates records with ALL fields defined in seedData.js,
 * with a fallback mechanism for fields that may not be immediately
 * accessible via the API due to Salesforce metadata cache delays.
 * 
 * Data source: ./seedData.js
 * - Volunteers (with bcrypt-hashed passwords)
 * - Events
 * - Registrations (linking volunteers to events)
 * - Volunteer Hours (tracking time worked)
 * - History records (if any are defined)
 */

const sfConfig = require('../config/salesForceConfig');
const jsforce = require('jsforce');
const seedData = require('./seedData');

async function smartSeed() {
    console.log('\n🌱 Smart Seeding: Full Data from seedData.js\n');
    console.log('═'.repeat(70));
    
    try {
        const authResult = await sfConfig.ensureAuthAndLogin();
        
        console.log('Debug - Auth result:', {
            instanceUrl: authResult.instanceUrl,
            accessToken: authResult.accessToken ? authResult.accessToken.substring(0, 20) + '...' : 'missing',
            authMode: authResult.authMode
        });
        
        if (!authResult.instanceUrl || !authResult.instanceUrl.startsWith('http')) {
            throw new Error(`Invalid instance URL: ${authResult.instanceUrl}`);
        }
        
        const conn = new jsforce.Connection({
            instanceUrl: authResult.instanceUrl,
            accessToken: authResult.accessToken
        });
        console.log('✅ Connected to Salesforce\n');
        console.log('⚠️  Note: Some fields may cause API errors but records may still be created.\n');
        console.log('─'.repeat(70) + '\n');
        
        // Step 1: Create Volunteers
        console.log('👥 Creating Volunteers...\n');
        const volunteers = [];
        
        // Import volunteer data from seedData.js and prepare for Salesforce
        const volunteersData = seedData.volunteers.map(vol => {
            // Convert Pass_Hash to Pass_Hash__c and format dates
            const volData = { ...vol };
            if (volData.Pass_Hash) {
                volData.Pass_Hash__c = volData.Pass_Hash;
                delete volData.Pass_Hash;
            }
            // Convert Date objects to ISO strings
            if (volData.Date_of_Birth__c instanceof Date) {
                volData.Date_of_Birth__c = volData.Date_of_Birth__c.toISOString().split('T')[0];
            }
            if (volData.Signature_Date__c instanceof Date) {
                volData.Signature_Date__c = volData.Signature_Date__c.toISOString().split('T')[0];
            }
            if (volData.Registration_Date__c instanceof Date) {
                volData.Registration_Date__c = volData.Registration_Date__c.toISOString();
            }
            // Remove the 'name' field as it's not a Salesforce field
            delete volData.name;
            return volData;
        });
        
        // Create volunteers with full data, catching errors for inaccessible fields
        for (const volData of volunteersData) {
            let created = false;
            let createdId = null;
            
            // First attempt: try with all fields
            try {
                const result = await conn.sobject('Volunteer__c').create(volData);
                if (result.success) {
                    volunteers.push(result.id);
                    createdId = result.id;
                    created = true;
                    console.log(`✅ Created (all fields): ${volData.First_Name__c} ${volData.Last_Name__c} (${result.id})`);
                }
            } catch (err) {
                // If creation failed, try with only accessible fields
                console.log(`⚠️  Full field creation failed for ${volData.First_Name__c}: ${err.message}`);
                console.log(`   Attempting with accessible fields only...`);
                
                // Minimal set of fields that are usually accessible
                const minimalVol = {
                    First_Name__c: volData.First_Name__c,
                    Last_Name__c: volData.Last_Name__c,
                    Electronic_Signature__c: volData.Electronic_Signature__c,
                    Signature_Date__c: volData.Signature_Date__c,
                    Registration_Date__c: volData.Registration_Date__c
                };
                
                try {
                    const result2 = await conn.sobject('Volunteer__c').create(minimalVol);
                    if (result2.success) {
                        volunteers.push(result2.id);
                        createdId = result2.id;
                        created = true;
                        console.log(`✅ Created (minimal fields): ${volData.First_Name__c} ${volData.Last_Name__c} (${result2.id})`);
                    }
                } catch (err2) {
                    console.log(`❌ Error creating ${volData.First_Name__c}: ${err2.message}`);
                }
            }
        }
        // Step 2: Create Events
        console.log('\n📅 Creating Events...\n');
        const events = [];
        
        // Import event data from seedData.js and prepare for Salesforce
        const eventsData = seedData.events.map(evt => {
            const evtData = { ...evt };
            // Convert Date objects to ISO strings
            if (evtData.Event_Date__c instanceof Date) {
                evtData.Event_Date__c = evtData.Event_Date__c.toISOString().split('T')[0];
            }
            if (evtData.Created_Date__c instanceof Date) {
                evtData.Created_Date__c = evtData.Created_Date__c.toISOString();
            }
            // Remove the 'name' field as it's not a Salesforce field
            delete evtData.name;
            return evtData;
        });
        
        for (const eventData of eventsData) {
            let created = false;
            
            // First attempt: try with all fields
            try {
                const result = await conn.sobject('Event__c').create(eventData);
                if (result.success) {
                    events.push(result.id);
                    created = true;
                    console.log(`✅ Created (all fields): ${eventData.Title__c} (${result.id})`);
                }
            } catch (err) {
                // If creation failed, try with only accessible fields
                console.log(`⚠️  Full field creation failed for ${eventData.Title__c}: ${err.message}`);
                console.log(`   Attempting with accessible fields only...`);
                
                const minimalEvent = {
                    Title__c: eventData.Title__c,
                    Event_Date__c: eventData.Event_Date__c
                };
                
                try {
                    const result2 = await conn.sobject('Event__c').create(minimalEvent);
                    if (result2.success) {
                        events.push(result2.id);
                        created = true;
                        console.log(`✅ Created (minimal fields): ${eventData.Title__c} (${result2.id})`);
                    }
                } catch (err2) {
                    console.log(`❌ Error creating ${eventData.Title__c}: ${err2.message}`);
                }
            }
        }
        
        // Step 3: Create Registrations (if we have volunteers and events)
        if (volunteers.length >= 2 && events.length >= 2) {
            console.log('\n📋 Creating Registrations...\n');
            
            // Import registration data from seedData.js and link to created volunteers/events
            const registrationsData = seedData.registrations.map((reg, index) => {
                const regData = { ...reg };
                // Link to volunteers and events
                regData.Volunteer__c = volunteers[index % volunteers.length];
                regData.Event__c = events[index % events.length];
                // Convert Date objects to ISO strings
                if (regData.Registration_Date__c instanceof Date) {
                    regData.Registration_Date__c = regData.Registration_Date__c.toISOString().split('T')[0];
                }
                // Remove the 'name' field
                delete regData.name;
                return regData;
            });
            
            for (const regData of registrationsData) {
                // Try with all fields first
                try {
                    const result = await conn.sobject('Registration__c').create(regData);
                    if (result.success) {
                        console.log(`✅ Created (all fields): Registration (${result.id})`);
                    }
                } catch (err) {
                    console.log(`⚠️  Full field creation failed: ${err.message}`);
                    console.log(`   Attempting with accessible fields only...`);
                    
                    // Try with minimal fields
                    const minimalReg = {
                        Volunteer__c: regData.Volunteer__c,
                        Event__c: regData.Event__c,
                        Registration_Date__c: regData.Registration_Date__c
                    };
                    
                    try {
                        const result2 = await conn.sobject('Registration__c').create(minimalReg);
                        if (result2.success) {
                            console.log(`✅ Created (minimal fields): Registration (${result2.id})`);
                        }
                    } catch (err2) {
                        console.log(`❌ Error creating registration: ${err2.message}`);
                    }
                }
            }
        } else {
            console.log('\n⚠️  Skipping registrations: need at least 2 volunteers and 2 events\n');
        }
        
        // Step 4: Create Volunteer Hours (if we have volunteers and events)
        if (volunteers.length >= 2 && events.length >= 2) {
            console.log('\n⏰ Creating Volunteer Hours...\n');
            
            // Import volunteer hours data from seedData.js and link to created volunteers/events
            const hoursData = seedData.volunteerHours.map((hour, index) => {
                const hourData = { ...hour };
                // Link to volunteers and events
                hourData.Volunteer__c = volunteers[index % volunteers.length];
                hourData.Event__c = events[index % events.length];
                // Convert Date objects to ISO strings
                if (hourData.Shift_Date__c instanceof Date) {
                    hourData.Shift_Date__c = hourData.Shift_Date__c.toISOString().split('T')[0];
                }
                if (hourData.Clock_In_Time__c instanceof Date) {
                    hourData.Clock_In_Time__c = hourData.Clock_In_Time__c.toISOString();
                }
                if (hourData.Clock_Out_Time__c instanceof Date) {
                    hourData.Clock_Out_Time__c = hourData.Clock_Out_Time__c.toISOString();
                }
                if (hourData.Submitted_Date__c instanceof Date) {
                    hourData.Submitted_Date__c = hourData.Submitted_Date__c.toISOString();
                }
                // Remove the 'name' field
                delete hourData.name;
                return hourData;
            });
            
            for (const hourData of hoursData) {
                // Try with all fields first
                try {
                    const result = await conn.sobject('VolunteerHours__c').create(hourData);
                    if (result.success) {
                        console.log(`✅ Created (all fields): Volunteer Hours - ${hourData.Total_Hours__c}h (${result.id})`);
                    }
                } catch (err) {
                    console.log(`⚠️  Full field creation failed: ${err.message}`);
                    console.log(`   Attempting with accessible fields only...`);
                    
                    // Try with minimal fields
                    const minimalHour = {
                        Volunteer__c: hourData.Volunteer__c,
                        Shift_Date__c: hourData.Shift_Date__c,
                        Clock_In_Time__c: hourData.Clock_In_Time__c
                    };
                    
                    try {
                        const result2 = await conn.sobject('VolunteerHours__c').create(minimalHour);
                        if (result2.success) {
                            console.log(`✅ Created (minimal fields): Volunteer Hours (${result2.id})`);
                        }
                    } catch (err2) {
                        console.log(`❌ Error creating volunteer hours: ${err2.message}`);
                    }
                }
            }
        } else {
            console.log('\n⚠️  Skipping volunteer hours: need at least 2 volunteers and 2 events\n');
        }
        
        // Step 5: Create History records (if we have volunteers)
        // Note: seedData.history is currently empty, so this will be skipped
        if (volunteers.length >= 2 && seedData.history.length > 0) {
            console.log('\n📜 Creating History records...\n');
            
            // Import history data from seedData.js and link to created volunteers
            const historyData = seedData.history.map((hist, index) => {
                const histData = { ...hist };
                // Link to volunteer if User__c is not set
                if (!histData.User__c) {
                    histData.User__c = volunteers[index % volunteers.length];
                }
                // Convert Date objects to ISO strings
                if (histData.Activity_Timestamp__c instanceof Date) {
                    histData.Activity_Timestamp__c = histData.Activity_Timestamp__c.toISOString();
                }
                // Remove the 'name' field if present
                delete histData.name;
                return histData;
            });
            
            for (const histData of historyData) {
                // Try with all fields first
                try {
                    const result = await conn.sobject('History__c').create(histData);
                    if (result.success) {
                        console.log(`✅ Created (all fields): History - ${histData.Activity_Type__c} (${result.id})`);
                    }
                } catch (err) {
                    console.log(`⚠️  Full field creation failed: ${err.message}`);
                    console.log(`   Attempting with accessible fields only...`);
                    
                    // Try with minimal fields (only fields that might be accessible)
                    const minimalHist = {
                        Activity_Type__c: histData.Activity_Type__c,
                        Activity_Timestamp__c: histData.Activity_Timestamp__c
                    };
                    
                    try {
                        const result2 = await conn.sobject('History__c').create(minimalHist);
                        if (result2.success) {
                            console.log(`✅ Created (minimal fields): History (${result2.id})`);
                        }
                    } catch (err2) {
                        console.log(`❌ Error creating history: ${err2.message}`);
                    }
                }
            }
        } else {
            console.log('\n⚠️  Skipping history: need at least 2 volunteers\n');
        }
        
        console.log('\n' + '═'.repeat(70));
        console.log('\n📊 Summary:');
        console.log(`   ✅ Volunteers: ${volunteers.length} created`);
        console.log(`   ✅ Events: ${events.length} created`);
        console.log(`   ✅ Registrations: Check Salesforce UI`);
        console.log(`   ✅ Volunteer Hours: Check Salesforce UI`);
        console.log(`   ✅ History: Check Salesforce UI`);
        console.log('\n💡 Refresh your Salesforce UI and check:');
        console.log('   App Launcher → Volunteer Management → Click each tab to see records');
        console.log('\n   Expected results:');
        console.log('   - Volunteers tab: 2 records');
        console.log('   - Events tab: 2 records');
        console.log('   - Registrations tab: 2 records');
        console.log('   - Volunteer Hours tab: 2 records');
        console.log('   - History tab: 2 records (if fields were accessible)\n');
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

smartSeed();
