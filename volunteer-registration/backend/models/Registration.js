const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema({
  name: { type: String, required: true }, // REG-{0000}
  Volunteer__c: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer', required: true },
  Event__c: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  Registration_Date__c: { type: Date, default: Date.now, required: true },
  Registration_Status__c: { type: String, enum: ['Registered', 'Confirmed', 'Cancelled', 'Completed', 'No Show'], default: 'Registered', required: true },
  Check_In_Time__c: { type: Date },
  Check_Out_Time__c: { type: Date },
  Attended__c: { type: Boolean, default: false },
  Notes__c: { type: String, maxlength: 32768 }
}, { timestamps: true });

RegistrationSchema.index({ Volunteer__c: 1, Event__c: 1 }, { unique: true });

module.exports = mongoose.model('VolunteerEventRegistration', RegistrationSchema);