// Salesforce-backed model compatibility layer for Registration
const createSFModel = require('../services/sfModel');
const sobject = process.env.SF_SOBJECT_REGISTRATION || 'Registration__c';
module.exports = createSFModel(sobject);