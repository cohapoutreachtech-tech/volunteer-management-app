const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  event_name: { type: String, required: true },
  event_id: { type: String, required: true, unique: true },
  max_volunteers: { type: Number, default: 0 },
  shift_times: { type: [String], default: [] },
  event_date: { type: Date },
  event_status: { type: String, enum: ['active', 'inactive', 'cancelled'], default: 'active' },
  event_details: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);
