module.exports = [
  { fullName: 'Title__c', label: 'Title', type: 'Text', length: 255, required: true },
  { fullName: 'Event_Date__c', label: 'Event Date', type: 'Date', required: true },
  { fullName: 'Event_Time__c', label: 'Event Time', type: 'Text', length: 20 },
  { fullName: 'Location__c', label: 'Location', type: 'Text', length: 255 },
  { fullName: 'Description__c', label: 'Description', type: 'LongTextArea', length: 32768, visibleLines: 3 },
  { fullName: 'Image_1_URL__c', label: 'Image 1 URL', type: 'Text', length: 255 },
  { fullName: 'Image_2_URL__c', label: 'Image 2 URL', type: 'Text', length: 255 },
  { fullName: 'Image_3_URL__c', label: 'Image 3 URL', type: 'Text', length: 255 },
  { fullName: 'Created_By__c', label: 'Created By', type: 'Lookup', referenceTo: ['Volunteer__c'], relationshipName: 'EventCreatedBy', relationshipLabel: 'Created By (Event)', deleteConstraint: 'Restrict' },
  { fullName: 'Created_Date__c', label: 'Created Date', type: 'DateTime' },
  { fullName: 'Event_Status__c', label: 'Event Status', type: 'Picklist', valueSet: { valueSetDefinition: { value: [ { fullName: 'Draft' }, { fullName: 'Published' }, { fullName: 'Completed' }, { fullName: 'Cancelled' } ] } } },
  { fullName: 'Max_Volunteers__c', label: 'Max Volunteers', type: 'Number', precision: 18, scale: 0 },
  { fullName: 'Registered_Volunteers__c', label: 'Registered Volunteers', type: 'Number', precision: 18, scale: 0 },
  { fullName: 'Checked_In_Volunteers__c', label: 'Checked In Volunteers', type: 'Number', precision: 18, scale: 0 }
];
