const mongoose = require('mongoose');

const VolunteerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  organization: String,
  role: { type: String, default: 'volunteer' },
  password: { type: String, required: true }
  // Add other fields as needed
}, { timestamps: true });

module.exports = mongoose.model('Volunteer', VolunteerSchema);