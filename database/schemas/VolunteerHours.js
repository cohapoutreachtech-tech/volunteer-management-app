module.exports = [
  { fullName: 'Volunteer__c', label: 'Volunteer', type: 'Lookup', referenceTo: ['Volunteer__c'], relationshipName: 'VolunteerHoursVolunteer', relationshipLabel: 'Volunteer (VolunteerHours)', deleteConstraint: 'Restrict', required: true },
  { fullName: 'Event__c', label: 'Event', type: 'Lookup', referenceTo: ['Event__c'], relationshipName: 'VolunteerHoursEvent', relationshipLabel: 'Event (VolunteerHours)' },
  { fullName: 'Shift_Date__c', label: 'Shift Date', type: 'Date', required: true },
  { fullName: 'Clock_In_Time__c', label: 'Clock In Time', type: 'DateTime', required: true },
  { fullName: 'Clock_Out_Time__c', label: 'Clock Out Time', type: 'DateTime' },
  { fullName: 'Total_Hours__c', label: 'Total Hours', type: 'Number', precision: 18, scale: 2 },
  { fullName: 'Approval_Status__c', label: 'Approval Status', type: 'Picklist', valueSet: { valueSetDefinition: { value: [ { fullName: 'Pending' }, { fullName: 'Approved' }, { fullName: 'Rejected' } ] } } },
  { fullName: 'Approved_By__c', label: 'Approved By', type: 'Lookup', referenceTo: ['Volunteer__c'], relationshipName: 'VolunteerHoursApprovedBy', relationshipLabel: 'Approved By (VolunteerHours)', deleteConstraint: 'Restrict' },
  { fullName: 'Approved_Date__c', label: 'Approved Date', type: 'DateTime' },
  { fullName: 'Rejection_Reason__c', label: 'Rejection Reason', type: 'Text', length: 255 },
  { fullName: 'Submitted_Date__c', label: 'Submitted Date', type: 'DateTime' },
  { fullName: 'Notes__c', label: 'Notes', type: 'LongTextArea', length: 32768, visibleLines: 3 }
];
