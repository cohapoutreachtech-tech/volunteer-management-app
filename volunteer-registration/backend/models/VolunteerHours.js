// Salesforce-backed model compatibility layer for VolunteerHours
const createSFModel = require('../services/sfModel');
const sobject = process.env.SF_SOBJECT_VOLUNTEERHOURS || 'VolunteerHours__c';
module.exports = createSFModel(sobject);
