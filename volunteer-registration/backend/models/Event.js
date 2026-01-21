// Salesforce-backed model compatibility layer
const createSFModel = require('../services/sfModel');
const sobject = process.env.SF_SOBJECT_EVENT || 'Event__c';
module.exports = createSFModel(sobject);
