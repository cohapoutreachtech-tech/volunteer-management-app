const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema({
  schema: { type: String, enum: ['Event', 'Volunteer', 'Registration', 'Auth', 'VolunteerHours'], required: true },
  activity_type: { type: String, enum: ['get', 'create', 'update', 'delete', 'login', 'background_check'], required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer', required: true },
  activity_timestamp: { type: Date, default: Date.now, required: true },
  activity_response: { type: String, required: true }
}, { collection: 'history' });

module.exports = mongoose.model('History', HistorySchema);
