const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const volunteerSchema = new mongoose.Schema({
  name: { type: String, required: true }, // VOL-{0000}
  First_Name__c: { type: String, required: true, maxlength: 80 },
  Last_Name__c: { type: String, required: true, maxlength: 80 },
  Email__c: { type: String, required: true, unique: true, maxlength: 80 },
  Phone__c: { type: String, maxlength: 40 },
  Date_of_Birth__c: { type: Date, required: true },
  Volunteer_Type__c: { type: String, enum: ['Individual', 'Company Representative'], required: true },
  Company_Name__c: { type: String, maxlength: 255 },
  Profile_Picture_URL__c: { type: String, maxlength: 255 },
  Facebook_Handle__c: { type: String, maxlength: 100 },
  Instagram_Handle__c: { type: String, maxlength: 100 },
  Text_Opt_In__c: { type: Boolean, default: false },
  T_Shirt_Size__c: { type: String, enum: ['XXS','XS','S','M','L','XL','2XL','3XL','4XL','5XL'], required: true },
  Why_Volunteer__c: { type: String, maxlength: 32768 },
  Events_Signed_Up__c: { type: String, maxlength: 32768 },
  Total_Hours_Available__c: { type: String, maxlength: 100 },
  Community_Service_Hours__c: { type: String, enum: ['Yes', 'No'], required: true },
  Volunteer_Assignments__c: { type: String, maxlength: 255 },
  Other_Assignment__c: { type: String, maxlength: 255 },
  Tasks_to_Avoid__c: { type: String, maxlength: 32768 },
  Skills_to_Use__c: { type: String, maxlength: 32768 },
  Certifications__c: { type: String, maxlength: 32768 },
  Certification_File_URL__c: { type: String, maxlength: 255 },
  Time_Preference__c: { type: String, maxlength: 255 },
  Day_Preference__c: { type: String, maxlength: 255 },
  Location_Preference__c: { type: String, enum: ['Indoor', 'Outdoor', 'No preference'] },
  Comfortable_With__c: { type: String, maxlength: 255 },
  Accommodations_Needed__c: { type: String, maxlength: 32768 },
  Offender_Policy_Confirmed__c: { type: Boolean, required: true },
  Additional_Comments__c: { type: String, maxlength: 32768 },
  Electronic_Signature__c: { type: String, maxlength: 255, required: true },
  Signature_Date__c: { type: Date, required: true },
  Registration_Date__c: { type: Date, default: Date.now, required: true },
  Status__c: { type: String, enum: ['Active', 'Inactive', 'Suspended'], default: 'Active', required: true },
  Total_Hours_Worked__c: { type: Number, default: 0 },
  Pass_Hash: { type: String, required: true } // stores the hash, required
}, { timestamps: true });

// Virtual for password (not persisted)
volunteerSchema.virtual('password')
  .set(function(password) {
    this._password = password;
  })
  .get(function() {
    return this._password;
  });

// Hash password before saving (for API-based creation)
volunteerSchema.pre('save', async function (next) {
  if (!this._password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.Pass_Hash = await bcrypt.hash(this._password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Volunteer', volunteerSchema);
module.exports = mongoose.model('Volunteer', volunteerSchema);
