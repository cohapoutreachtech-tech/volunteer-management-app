const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer', required: true },
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  shift_time: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Registration', RegistrationSchema);