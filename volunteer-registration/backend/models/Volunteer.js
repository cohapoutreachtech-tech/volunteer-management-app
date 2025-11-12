const mongoose = require('mongoose');

const VolunteerSchema = new mongoose.Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  address_line: { type: String, required: true },
  state: { type: String, required: true },
  city: { type: String, required: true },
  zipcode: { type: String, required: true },
  name: String, // optional, for backward compatibility
  email: { type: String, required: true, unique: true },
  phone: String,
  organization: String,
  role: { type: String, default: 'volunteer' },
  password: { type: String, required: true },
  status: { type: String, enum: ['pending_approval', 'active', 'rejected'], default: 'pending_approval' },
  type: { type: String, enum: ['Volunteer', 'Admin'], default: 'Volunteer' }
  // Add other fields as needed
}, { timestamps: true });

module.exports = mongoose.model('Volunteer', VolunteerSchema);