const jsforce = require('jsforce');

// Build metadata descriptions for the custom objects and fields
function buildObjectsMetadata() {
  const objects = [];

  // Event__c
  objects.push({
    fullName: 'Event__c',
    label: 'Event',
    pluralLabel: 'Events',
    nameField: { type: 'Text', label: 'Event Number' },
    deploymentStatus: 'Deployed',
    sharingModel: 'ReadWrite',
    fields: [
      { fullName: 'Title__c', label: 'Title', type: 'Text', length: 255, required: true },
      { fullName: 'Event_Date__c', label: 'Event Date', type: 'Date', required: true },
      { fullName: 'Event_Time__c', label: 'Event Time', type: 'Text', length: 20 },
      { fullName: 'Location__c', label: 'Location', type: 'Text', length: 255 },
      { fullName: 'Description__c', label: 'Description', type: 'LongTextArea', length: 32768, visibleLines: 3 },
      { fullName: 'Image_1_URL__c', label: 'Image 1 URL', type: 'Text', length: 255 },
      { fullName: 'Image_2_URL__c', label: 'Image 2 URL', type: 'Text', length: 255 },
      { fullName: 'Image_3_URL__c', label: 'Image 3 URL', type: 'Text', length: 255 },
      { fullName: 'Event_Status__c', label: 'Event Status', type: 'Picklist', required: true, valueSet: { valueSetDefinition: { value: [
        { fullName: 'Draft' }, { fullName: 'Published' }, { fullName: 'Completed' }, { fullName: 'Cancelled' }
      ] } } },
      { fullName: 'Max_Volunteers__c', label: 'Max Volunteers', type: 'Number', precision: 18, scale: 0 },
    ]
  });

  // Volunteer__c
  objects.push({
    fullName: 'Volunteer__c',
    label: 'Volunteer',
    pluralLabel: 'Volunteers',
    nameField: { type: 'Text', label: 'Volunteer Number' },
    deploymentStatus: 'Deployed',
    sharingModel: 'ReadWrite',
    fields: [
      { fullName: 'First_Name__c', label: 'First Name', type: 'Text', length: 80, required: true },
      { fullName: 'Last_Name__c', label: 'Last Name', type: 'Text', length: 80, required: true },
  // Email/Phone: do not specify 'length' for these types (Metadata API rejects it)
  { fullName: 'Email__c', label: 'Email', type: 'Email' },
  { fullName: 'Phone__c', label: 'Phone', type: 'Phone' },
      { fullName: 'Date_of_Birth__c', label: 'Date of Birth', type: 'Date' },
      { fullName: 'Volunteer_Type__c', label: 'Volunteer Type', type: 'Picklist', valueSet: { valueSetDefinition: { value: [
        { fullName: 'Individual' }, { fullName: 'Company Representative' }, { fullName: 'Administrator' }
      ] } } },
      { fullName: 'Company_Name__c', label: 'Company Name', type: 'Text', length: 255 },
      { fullName: 'Profile_Picture_URL__c', label: 'Profile Picture URL', type: 'Text', length: 255 },
  // Checkbox fields require a defaultValue (string 'true' or 'false')
  { fullName: 'Text_Opt_In__c', label: 'Text Opt In', type: 'Checkbox', defaultValue: 'false' },
      { fullName: 'T_Shirt_Size__c', label: 'T Shirt Size', type: 'Picklist', valueSet: { valueSetDefinition: { value: [
        { fullName: 'XXS' },{ fullName: 'XS' },{ fullName: 'S' },{ fullName: 'M' },{ fullName: 'L' },{ fullName: 'XL' },{ fullName: '2XL' },{ fullName: '3XL' },{ fullName: '4XL' },{ fullName: '5XL' }
      ] } } },
      { fullName: 'Why_Volunteer__c', label: 'Why Volunteer', type: 'LongTextArea', length: 32768, visibleLines: 3 },
      { fullName: 'Community_Service_Hours__c', label: 'Community Service Hours', type: 'Picklist', valueSet: { valueSetDefinition: { value: [ { fullName: 'Yes' }, { fullName: 'No' } ] } } },
  { fullName: 'Offender_Policy_Confirmed__c', label: 'Offender Policy Confirmed', type: 'Checkbox', defaultValue: 'false' },
      { fullName: 'Electronic_Signature__c', label: 'Electronic Signature', type: 'Text', length: 255 },
      { fullName: 'Signature_Date__c', label: 'Signature Date', type: 'Date' },
      { fullName: 'Registration_Date__c', label: 'Registration Date', type: 'DateTime' },
      { fullName: 'Status__c', label: 'Status', type: 'Picklist', valueSet: { valueSetDefinition: { value: [ { fullName: 'Active' }, { fullName: 'Inactive' }, { fullName: 'Suspended' } ] } } },
      { fullName: 'Total_Hours_Worked__c', label: 'Total Hours Worked', type: 'Number', precision: 18, scale: 2 },
      { fullName: 'Pass_Hash__c', label: 'Pass Hash', type: 'Text', length: 255 }
    ]
  });

  // Registration__c
  objects.push({
    fullName: 'Registration__c',
    label: 'Registration',
    pluralLabel: 'Registrations',
    nameField: { type: 'Text', label: 'Registration Number' },
    deploymentStatus: 'Deployed',
    sharingModel: 'ReadWrite',
    fields: [
  // Lookup fields require relationshipName - use alphanumeric names (no underscores) and provide relationshipLabel
  { fullName: 'Volunteer__c', label: 'Volunteer', type: 'Lookup', referenceTo: ['Volunteer__c'], relationshipName: 'RegistrationVolunteer', relationshipLabel: 'Volunteer (Registration)', deleteConstraint: 'Restrict', required: true },
  { fullName: 'Event__c', label: 'Event', type: 'Lookup', referenceTo: ['Event__c'], relationshipName: 'RegistrationEvent', relationshipLabel: 'Event (Registration)', deleteConstraint: 'Restrict', required: true },
      { fullName: 'Registration_Date__c', label: 'Registration Date', type: 'DateTime' },
      { fullName: 'Registration_Status__c', label: 'Registration Status', type: 'Picklist', valueSet: { valueSetDefinition: { value: [
        { fullName: 'Registered' },{ fullName: 'Confirmed' },{ fullName: 'Cancelled' },{ fullName: 'Completed' },{ fullName: 'No Show' }
      ] } } },
      { fullName: 'Check_In_Time__c', label: 'Check In Time', type: 'DateTime' },
      { fullName: 'Check_Out_Time__c', label: 'Check Out Time', type: 'DateTime' },
      { fullName: 'Attended__c', label: 'Attended', type: 'Checkbox', defaultValue: 'false' },
      { fullName: 'Notes__c', label: 'Notes', type: 'LongTextArea', length: 32768, visibleLines: 3 }
    ]
  });

  // VolunteerHours__c
  objects.push({
    fullName: 'VolunteerHours__c',
    label: 'Volunteer Hours',
    pluralLabel: 'Volunteer Hours',
    nameField: { type: 'Text', label: 'Hours Number' },
    deploymentStatus: 'Deployed',
    sharingModel: 'ReadWrite',
    fields: [
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
    ]
  });

  // History__c
  objects.push({
    fullName: 'History__c',
    label: 'History',
    pluralLabel: 'History',
    nameField: { type: 'Text', label: 'History Number' },
    deploymentStatus: 'Deployed',
    sharingModel: 'ReadWrite',
    fields: [
      { fullName: 'Schema__c', label: 'Schema', type: 'Picklist', valueSet: { valueSetDefinition: { value: [ { fullName: 'Event' }, { fullName: 'Volunteer' }, { fullName: 'Registration' }, { fullName: 'Auth' }, { fullName: 'VolunteerHours' } ] } } },
      { fullName: 'Activity_Type__c', label: 'Activity Type', type: 'Picklist', valueSet: { valueSetDefinition: { value: [ { fullName: 'get' }, { fullName: 'create' }, { fullName: 'update' }, { fullName: 'delete' }, { fullName: 'login' }, { fullName: 'background_check' } ] } } },
  { fullName: 'User__c', label: 'User', type: 'Lookup', referenceTo: ['Volunteer__c'], relationshipName: 'HistoryUser', relationshipLabel: 'User (History)' },
      { fullName: 'Activity_Timestamp__c', label: 'Activity Timestamp', type: 'DateTime' },
      { fullName: 'Activity_Response__c', label: 'Activity Response', type: 'LongTextArea', length: 32768, visibleLines: 3 }
    ]
  });

  return objects;
}

async function createMetadata(conn, apply = false) {
  const objects = buildObjectsMetadata();
  const results = [];

  for (const obj of objects) {
    const fullName = `${obj.fullName}`;
    try {
      // check if object exists
      const existing = await conn.metadata.read('CustomObject', fullName).catch(() => null);
      if (existing && existing.fullName) {
        if (!apply) {
          results.push({ fullName, status: 'exists' });
          continue;
        }

        // If applying and the object exists, attempt to update the CustomObject
        try {
          const updateRes = await conn.metadata.update('CustomObject', obj);
          results.push({ fullName, status: 'updated', result: updateRes });
        } catch (upErr) {
          // If update fails, record it but continue to attempt to create missing fields individually below
          results.push({ fullName, status: 'error-update', error: String(upErr) });
        }

        // Also ensure each individual field exists; create missing CustomField metadata entries.
        for (const f of obj.fields || []) {
          const fieldFullName = `${obj.fullName}.${f.fullName}`;
          try {
            const existingField = await conn.metadata.read('CustomField', fieldFullName).catch(() => null);
            if (existingField && existingField.fullName) {
              // field exists
              continue;
            }
          } catch (e) {
            // proceed to try create
          }

          // build a minimal CustomField metadata payload from the object's field definition
          const fieldMeta = { fullName: fieldFullName, label: f.label, type: f.type };
          if (f.length) fieldMeta.length = f.length;
          if (f.precision) fieldMeta.precision = f.precision;
          if (f.scale) fieldMeta.scale = f.scale;
          if (f.visibleLines) fieldMeta.visibleLines = f.visibleLines;
          if (f.defaultValue !== undefined) fieldMeta.defaultValue = f.defaultValue;
          if (f.valueSet) fieldMeta.valueSet = f.valueSet;
          if (f.referenceTo) fieldMeta.referenceTo = f.referenceTo;
          if (f.relationshipName) fieldMeta.relationshipName = f.relationshipName;
          if (f.relationshipLabel) fieldMeta.relationshipLabel = f.relationshipLabel;
          if (f.deleteConstraint) fieldMeta.deleteConstraint = f.deleteConstraint;

          try {
            const createFieldRes = await conn.metadata.create('CustomField', fieldMeta);
            results.push({ fullName: fieldFullName, status: 'field-created', result: createFieldRes });
          } catch (cfErr) {
            results.push({ fullName: fieldFullName, status: 'field-error', error: String(cfErr) });
          }
        }

        continue;
      }
    } catch (err) {
      // non-fatal - proceed to create
    }

    if (!apply) {
      results.push({ fullName, status: 'would-create' });
      continue;
    }

    try {
      const res = await conn.metadata.create('CustomObject', obj);
      results.push({ fullName, status: 'created', result: res });
    } catch (err) {
      results.push({ fullName, status: 'error', error: String(err) });
    }
  }

  return results;
}

module.exports = { buildObjectsMetadata, createMetadata };
