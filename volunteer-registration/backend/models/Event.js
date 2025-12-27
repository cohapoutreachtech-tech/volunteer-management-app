const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  name: { type: String, required: true }, // EVT-{0000}
  Title__c: { type: String, required: true, maxlength: 255 },
  Event_Date__c: { type: Date, required: true },
  Event_Time__c: { type: String, maxlength: 20, required: true },
  Location__c: { type: String, maxlength: 255, required: true },
  Description__c: { type: String, maxlength: 32768, required: true },
  Image_1_URL__c: { type: String, maxlength: 255 },
  Image_2_URL__c: { type: String, maxlength: 255 },
  Image_3_URL__c: { type: String, maxlength: 255 },
  Created_By__c: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer', required: true },
  Created_Date__c: { type: Date, default: Date.now, required: true },
  Event_Status__c: { type: String, enum: ['Draft', 'Published', 'Completed', 'Cancelled'], default: 'Published', required: true },
  Max_Volunteers__c: { type: Number },
  Registered_Volunteers__c: { type: Number, default: 0 },
  Checked_In_Volunteers__c: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);
