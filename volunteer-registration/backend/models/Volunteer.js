const bcrypt = require('bcrypt');
// Export a Salesforce-backed model instance for Volunteer
const createSFModel = require('../services/sfModel');
const sobject = process.env.SF_SOBJECT_VOLUNTEER || 'Volunteer__c';
const Model = createSFModel(sobject);

// Helper: hash a plain password for storing as Pass_Hash__c
Model.hashPassword = function(plain) {
  return bcrypt.hashSync(plain, 10);
};

// Convenience create wrapper that will hash password fields if provided
Model.createWithPassword = async function(payload = {}) {
  const copy = { ...payload };
  if (copy.password) {
    copy.Pass_Hash__c = Model.hashPassword(copy.password);
    delete copy.password;
  }
  return Model.create(copy);
};

module.exports = Model;