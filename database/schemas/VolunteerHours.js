const mongoose = require('mongoose');

const volunteerHoursSchema = new mongoose.Schema({
  name: { type: String, required: true }, // HRS-{0000} (simulate auto-number)
  Volunteer__c: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer', required: true },
  Event__c: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  Shift_Date__c: { type: Date, required: true },
  Clock_In_Time__c: { type: Date, required: true },
  Clock_Out_Time__c: { type: Date },
  Total_Hours__c: { type: Number, default: 0 },
  Approval_Status__c: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending', required: true },
  Approved_By__c: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer' },
  Approved_Date__c: { type: Date },
  Rejection_Reason__c: { type: String, maxlength: 255 },
  Submitted_Date__c: { type: Date, required: true },
  Notes__c: { type: String, maxlength: 32768 }
}, { timestamps: true });

module.exports = mongoose.model('VolunteerHours', volunteerHoursSchema);
