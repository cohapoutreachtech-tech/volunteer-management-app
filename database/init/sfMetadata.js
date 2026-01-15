const jsforce = require('jsforce');

// Build metadata descriptions for the custom objects and fields using schema modules
const volunteerFields = require('../schemas/Volunteer');
const eventFields = require('../schemas/Event');
const registrationFields = require('../schemas/Registration');
const volunteerHoursFields = require('../schemas/VolunteerHours');
const historyFields = require('../schemas/History');

function buildObjectsMetadata() {
  const objects = [];

  // Volunteer pushed first to resolve 'Event.Created_By' dependency
  objects.push({
    fullName: 'Volunteer__c',
    label: 'Volunteer',
    pluralLabel: 'Volunteers',
    nameField: { type: 'Text', label: 'Volunteer Number' },
    deploymentStatus: 'Deployed',
    sharingModel: 'ReadWrite',
    fields: volunteerFields
  });

  objects.push({
    fullName: 'Event__c',
    label: 'Event',
    pluralLabel: 'Events',
    nameField: { type: 'Text', label: 'Event Number' },
    deploymentStatus: 'Deployed',
    sharingModel: 'ReadWrite',
    fields: eventFields
  });

  objects.push({
    fullName: 'Registration__c',
    label: 'Registration',
    pluralLabel: 'Registrations',
    nameField: { type: 'Text', label: 'Registration Number' },
    deploymentStatus: 'Deployed',
    sharingModel: 'ReadWrite',
    fields: registrationFields
  });

  objects.push({
    fullName: 'VolunteerHours__c',
    label: 'Volunteer Hours',
    pluralLabel: 'Volunteer Hours',
    nameField: { type: 'Text', label: 'Hours Number' },
    deploymentStatus: 'Deployed',
    sharingModel: 'ReadWrite',
    fields: volunteerHoursFields
  });

  objects.push({
    fullName: 'History__c',
    label: 'History',
    pluralLabel: 'History',
    nameField: { type: 'Text', label: 'History Number' },
    deploymentStatus: 'Deployed',
    sharingModel: 'ReadWrite',
    fields: historyFields
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