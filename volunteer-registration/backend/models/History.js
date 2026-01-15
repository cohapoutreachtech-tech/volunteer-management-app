// Salesforce-backed model compatibility layer for History
const createSFModel = require('../services/sfModel');
const sobject = process.env.SF_SOBJECT_HISTORY || 'History__c';
module.exports = createSFModel(sobject);
