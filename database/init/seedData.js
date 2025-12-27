const bcrypt = require('bcrypt');

const hashPassword = (plain) => bcrypt.hashSync(plain, 10);

const volunteers = [
  {
    name: 'VOL-0001',
    First_Name__c: 'Admin',
    Last_Name__c: 'COHAP',
    Email__c: 'admin@cohap.org',
    Phone__c: '260-555-0001',
    Date_of_Birth__c: new Date('1980-01-01'),
    Volunteer_Type__c: 'Individual',
    T_Shirt_Size__c: 'L',
    Why_Volunteer__c: 'Lead admin.',
    Community_Service_Hours__c: 'Yes',
    Offender_Policy_Confirmed__c: true,
    Electronic_Signature__c: 'Admin COHAP',
    Signature_Date__c: new Date(),
    Registration_Date__c: new Date(),
    Status__c: 'Active',
    Pass_Hash: hashPassword('admin123')
  },
  {
    name: 'VOL-0002',
    First_Name__c: 'John',
    Last_Name__c: 'Volunteer',
    Email__c: 'volunteer@cohap.org',
    Phone__c: '260-555-0002',
    Date_of_Birth__c: new Date('2000-05-15'),
    Volunteer_Type__c: 'Individual',
    T_Shirt_Size__c: 'M',
    Why_Volunteer__c: 'I want to help.',
    Community_Service_Hours__c: 'Yes',
    Offender_Policy_Confirmed__c: true,
    Electronic_Signature__c: 'John Volunteer',
    Signature_Date__c: new Date(),
    Registration_Date__c: new Date(),
    Status__c: 'Active',
    Pass_Hash: hashPassword('volunteer123')
  }
];

const events = [
  {
    name: 'EVT-0001',
    Title__c: 'COHAP Community Cleanup',
    Event_Date__c: new Date('2024-03-15'),
    Event_Time__c: '10:00 AM',
    Location__c: 'Central Park',
    Description__c: 'COHAP organized community park cleanup',
    Created_By__c: null, // will be set in init script
    Created_Date__c: new Date(),
    Event_Status__c: 'Published',
    Max_Volunteers__c: 20
  },
  {
    name: 'EVT-0002',
    Title__c: 'COHAP Food Drive',
    Event_Date__c: new Date('2024-03-20'),
    Event_Time__c: '2:00 PM',
    Location__c: 'COHAP Community Center',
    Description__c: 'Monthly food donation drive',
    Created_By__c: null,
    Created_Date__c: new Date(),
    Event_Status__c: 'Published',
    Max_Volunteers__c: 15
  }
];

// Each volunteer object MUST have Pass_Hash and NO password property

module.exports = { volunteers, events };
