module.exports = [
  { fullName: 'Schema__c', label: 'Schema', type: 'Picklist', valueSet: { valueSetDefinition: { value: [ { fullName: 'Event' }, { fullName: 'Volunteer' }, { fullName: 'Registration' }, { fullName: 'Auth' }, { fullName: 'VolunteerHours' } ] } } },
  { fullName: 'Activity_Type__c', label: 'Activity Type', type: 'Picklist', valueSet: { valueSetDefinition: { value: [ { fullName: 'get' }, { fullName: 'create' }, { fullName: 'update' }, { fullName: 'delete' }, { fullName: 'login' }, { fullName: 'background_check' } ] } } },
  { fullName: 'User__c', label: 'User', type: 'Lookup', referenceTo: ['Volunteer__c'], relationshipName: 'HistoryUser', relationshipLabel: 'User (History)' },
  { fullName: 'Activity_Timestamp__c', label: 'Activity Timestamp', type: 'DateTime' },
  { fullName: 'Activity_Response__c', label: 'Activity Response', type: 'LongTextArea', length: 32768, visibleLines: 3 }
];
