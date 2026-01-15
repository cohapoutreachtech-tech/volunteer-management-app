const bcrypt = require('bcrypt');

const hashPassword = (plain) => bcrypt.hashSync(plain, 10);

const volunteers = [
  {
    name: 'VOL-0001',
    First_Name__c: 'Administrator',
    Last_Name__c: 'COHAP',
    Email__c: 'admin@cohap.org',
    Phone__c: '260-555-0001',
    Date_of_Birth__c: new Date('1980-01-01'),
    Volunteer_Type__c: 'Administrator',
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

const history = [];

// Registrations - these will need to be linked to Volunteer and Event IDs after they're created
const registrations = [
  {
    name: 'REG-0001',
    // Volunteer__c and Event__c will be set dynamically after records are created
    Registration_Date__c: new Date(),
    Registration_Status__c: 'Confirmed',
    Attended__c: false,
    Notes__c: 'First registration for testing'
  },
  {
    name: 'REG-0002',
    Registration_Date__c: new Date(),
    Registration_Status__c: 'Confirmed',
    Attended__c: false,
    Notes__c: 'Second registration for testing'
  }
];

// Volunteer Hours - these will also need to be linked after records are created
const volunteerHours = [
  {
    name: 'VH-0001',
    // Volunteer__c and Event__c will be set dynamically
    Shift_Date__c: new Date('2024-03-15'),
    Clock_In_Time__c: new Date('2024-03-15T09:00:00Z'),
    Clock_Out_Time__c: new Date('2024-03-15T12:00:00Z'),
    Total_Hours__c: 3.0,
    Approval_Status__c: 'Pending',
    Submitted_Date__c: new Date(),
    Notes__c: 'Morning shift at community cleanup'
  },
  {
    name: 'VH-0002',
    Shift_Date__c: new Date('2024-03-20'),
    Clock_In_Time__c: new Date('2024-03-20T14:00:00Z'),
    Clock_Out_Time__c: new Date('2024-03-20T17:30:00Z'),
    Total_Hours__c: 3.5,
    Approval_Status__c: 'Approved',
    Submitted_Date__c: new Date(),
    Notes__c: 'Afternoon shift at food drive'
  }
];

module.exports = { volunteers, events, history, registrations, volunteerHours };
