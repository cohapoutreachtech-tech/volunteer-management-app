module.exports = [
  { fullName: 'Volunteer__c', label: 'Volunteer', type: 'Lookup', referenceTo: ['Volunteer__c'], relationshipName: 'RegistrationVolunteer', relationshipLabel: 'Volunteer (Registration)', deleteConstraint: 'Restrict', required: true },
  { fullName: 'Event__c', label: 'Event', type: 'Lookup', referenceTo: ['Event__c'], relationshipName: 'RegistrationEvent', relationshipLabel: 'Event (Registration)', deleteConstraint: 'Restrict', required: true },
  { fullName: 'Registration_Date__c', label: 'Registration Date', type: 'DateTime', required: true },
  { fullName: 'Registration_Status__c', label: 'Registration Status', type: 'Picklist', valueSet: { valueSetDefinition: { value: [ { fullName: 'Registered' }, { fullName: 'Confirmed' }, { fullName: 'Cancelled' }, { fullName: 'Completed' }, { fullName: 'No Show' } ] } } },
  { fullName: 'Check_In_Time__c', label: 'Check In Time', type: 'DateTime' },
  { fullName: 'Check_Out_Time__c', label: 'Check Out Time', type: 'DateTime' },
  { fullName: 'Attended__c', label: 'Attended', type: 'Checkbox', defaultValue: 'false' },
  { fullName: 'Notes__c', label: 'Notes', type: 'LongTextArea', length: 32768, visibleLines: 3 }
];
