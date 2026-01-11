const Volunteer = require('../models/Volunteer');
const History = require('../models/History');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const requiredFields = [
  'First_Name__c',
  'Last_Name__c',
  'Email__c',
  'Date_of_Birth__c',
  'Volunteer_Type__c',
  'T_Shirt_Size__c',
  'Why_Volunteer__c',
  'Community_Service_Hours__c',
  'Offender_Policy_Confirmed__c',
  'Electronic_Signature__c',
  'Signature_Date__c',
  'Registration_Date__c',
  'Status__c'
];

// Log activity to History collection
async function logActivity({ schema, activity_type, user_id, activity_response }) {
  try {
    await History.create({
      schema,
      activity_type,
      user_id,
      activity_response
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

// Define the createVolunteer controller
const createVolunteer = async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ message: 'Bad request: Request body must be a valid JSON object.' });
    }

    // Validate required fields
    const missing = requiredFields.filter(field => !(field in req.body));
    if (missing.length > 0) {
      return res.status(400).json({
        message: `Missing required field(s): ${missing.join(', ')}`
      });
    }

    // Check if email already exists
    const existing = await Volunteer.findOne({ Email__c: req.body.Email__c });
    if (existing) {
      return res.status(409).json({
        message: "An account with that email already exists, reset your password if you cannot login"
      });
    }

    // Generate a unique name (auto-number simulation)
    const count = await Volunteer.countDocuments();
    const name = `VOL-${(count + 1).toString().padStart(4, '0')}`;

    // Remove password from req.body before spreading
    const { password, ...rest } = req.body;

    // Create the user/volunteer instance
    const volunteer = new Volunteer({
      ...rest,
      name,
      Volunteer_Type__c: rest.Volunteer_Type__c || 'Individual', // default to Individual if not provided
      Status__c: rest.Status__c || 'Active'
    });

    // Set password using the virtual setter
    if (password) {
      // Hash password and set Pass_Hash directly (if you want to do it here)
      const salt = await bcrypt.genSalt(10);
      volunteer.Pass_Hash = await bcrypt.hash(password, salt);
    }

    // Debug: log before save
    console.log('DEBUG volunteer before save:', volunteer);

    await volunteer.save();
    await logActivity({
      schema: 'Volunteer',
      activity_type: 'create',
      user_id: volunteer._id,
      activity_response: `User ${volunteer.First_Name__c} ${volunteer.Last_Name__c} was created`
    });

    // Debug: log after save
    console.log('DEBUG volunteer after save:', volunteer);

    res.status(201).json({
      message: `User ${volunteer.First_Name__c} ${volunteer.Last_Name__c} was created`,
      id: volunteer._id
    });
  } catch (err) {
    await logActivity({
      schema: 'Volunteer',
      activity_type: 'create',
      user_id: null,
      activity_response: err.message
    });
    console.error('Create volunteer error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Example: Find volunteer by email
const getVolunteerByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    // Normalize email to catch placeholders and whitespace-only values
    const normalizedEmail = (email === undefined || email === null) ? '' : String(email).trim();
    if (normalizedEmail === '' || normalizedEmail === ':email' || ['undefined', 'null'].includes(normalizedEmail.toLowerCase())) {
      return res.status(400).json({ message: 'email should not be empty' });
    }

    const volunteer = await Volunteer.findOne({ Email__c: normalizedEmail });
    if (!volunteer) {
      await logActivity({
        schema: 'Volunteer',
        activity_type: 'get',
        user_id: req.user?.id || null,
        activity_response: 'Volunteer not found'
      });
      return res.status(404).json({ message: 'Volunteer not found' });
    }
    await logActivity({
      schema: 'Volunteer',
      activity_type: 'get',
      user_id: req.user?.id || volunteer._id,
      activity_response: `Volunteer ${volunteer._id} retrieved`
    });
    res.json(volunteer);
  } catch (err) {
    await logActivity({
      schema: 'Volunteer',
      activity_type: 'get',
      user_id: req.user?.id || null,
      activity_response: err.message
    });
    res.status(500).json({ message: 'Server error.' });
  }
};

// Example: Update volunteer
const updateVolunteer = async (req, res) => {
  try {
    console.log('--- [PUT] /volunteers/:id ---');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);

    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ message: 'Bad request: Request body must be a valid JSON object.' });
    }

    const { id } = req.params;
    // Normalize id to catch literal placeholders like ':id', 'undefined', 'null', or whitespace
    const normalizedId = (id === undefined || id === null) ? '' : String(id).trim();
    if (normalizedId === '' || normalizedId === ':id' || ['undefined', 'null'].includes(normalizedId.toLowerCase())) {
      return res.status(400).json({ message: 'volunteer id should not be empty' });
    }
    if (!mongoose.Types.ObjectId.isValid(normalizedId)) {
      return res.status(400).json({ message: 'Invalid volunteer id format' });
    }
    const updateFields = { ...req.body };

  // Debug: log the incoming update request
  console.log('DEBUG updateVolunteer:', { id: normalizedId, updateFields });

    // List of fields that should NOT be updated directly
    const protectedFields = [
      'Pass_Hash',
      'createdAt',
      'Registration_Date__c',
      'Offender_Policy_Confirmed__c',
      '_id',
      '__v'
    ];

    // Find which protected fields are being attempted to update (case-sensitive)
    const attemptedProtected = Object.keys(updateFields).filter(field => protectedFields.includes(field));
    if (attemptedProtected.length > 0) {
      return res.status(400).json({
        message: `The following field(s) are protected and cannot be updated: ${attemptedProtected.join(', ')}`
      });
    }

    // If password is being updated, hash it and store as Pass_Hash
    if (updateFields.password) {
      const salt = await bcrypt.genSalt(10);
      updateFields.Pass_Hash = await bcrypt.hash(updateFields.password, salt);
      delete updateFields.password;
    }

    // Remove all protected fields from updateFields (in case they were sent but not caught above)
    protectedFields.forEach(field => delete updateFields[field]);

    // Actually update the document
  const volunteer = await Volunteer.findByIdAndUpdate(normalizedId, updateFields, { new: true });
    if (!volunteer) {
      await logActivity({
        schema: 'Volunteer',
        activity_type: 'update',
        user_id: req.user?.id || null,
        activity_response: 'Volunteer not found'
      });
      return res.status(404).json({ message: 'Volunteer not found' });
    }
    await logActivity({
      schema: 'Volunteer',
      activity_type: 'update',
      user_id: req.user?.id || volunteer._id,
      activity_response: `Account for user ${volunteer._id} was updated.`
    });
    res.json({ message: `Account for user ${volunteer._id} was updated.` });
  } catch (err) {
    await logActivity({
      schema: 'Volunteer',
      activity_type: 'update',
      user_id: req.user?.id || null,
      activity_response: err.message
    });
    // Handle duplicate email error
    if (err.code === 11000 && err.keyPattern && err.keyPattern.Email__c) {
      return res.status(409).json({
        message: "An account with that email already exists, reset your password if you cannot login"
      });
    }
    console.error('Update volunteer error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Delete volunteer
const deleteVolunteer = async (req, res) => {
  try {
    const { id } = req.params;
    // Normalize id to catch literal placeholders like ':id', 'undefined', 'null', or whitespace
    const normalizedId = (id === undefined || id === null) ? '' : String(id).trim();
    if (normalizedId === '' || normalizedId === ':id' || ['undefined', 'null'].includes(normalizedId.toLowerCase())) {
      return res.status(400).json({ message: 'volunteer id should not be empty' });
    }
    if (!mongoose.Types.ObjectId.isValid(normalizedId)) {
      return res.status(400).json({ message: 'Invalid volunteer id format' });
    }

  const volunteer = await Volunteer.findByIdAndDelete(normalizedId);
    if (!volunteer) {
      await logActivity({
        schema: 'Volunteer',
        activity_type: 'delete',
        user_id: req.user?.id || null,
        activity_response: 'Volunteer not found'
      });
      return res.status(404).json({ message: 'Volunteer not found' });
    }
    await logActivity({
      schema: 'Volunteer',
      activity_type: 'delete',
      user_id: req.user?.id || volunteer._id,
      activity_response: `Account for user ${volunteer._id} was deleted.`
    });
    res.json({ message: `Account for user ${volunteer._id} was deleted.` });
  } catch (err) {
    await logActivity({
      schema: 'Volunteer',
      activity_type: 'delete',
      user_id: req.user?.id || null,
      activity_response: err.message
    });
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get all volunteers
const getAllVolunteers = async (req, res) => {
  try {
    const volunteers = await Volunteer.find({});
    await logActivity({
      schema: 'Volunteer',
      activity_type: 'get',
      user_id: req.user?.id || null,
      activity_response: 'All volunteers retrieved'
    });
    res.json(volunteers);
  } catch (err) {
    await logActivity({
      schema: 'Volunteer',
      activity_type: 'get',
      user_id: req.user?.id || null,
      activity_response: err.message
    });
    res.status(500).json({ message: 'Server error.' });
  }
};


// Get volunteer by ID
const getVolunteerById = async (req, res) => {
  try {
    const { id } = req.params;

    // Normalize id to catch literal placeholders like ':id', 'undefined', 'null', or whitespace
    const normalizedId = (id === undefined || id === null) ? '' : String(id).trim();
    if (normalizedId === '' || normalizedId === ':id' || ['undefined', 'null'].includes(normalizedId.toLowerCase())) {
      return res.status(400).json({ message: 'volunteer id should not be empty' });
    }

    // Validate ObjectId format to avoid CastError returning 500
    if (!mongoose.Types.ObjectId.isValid(normalizedId)) {
      return res.status(400).json({ message: 'Invalid volunteer id format' });
    }

    const volunteer = await Volunteer.findById(normalizedId);
    if (!volunteer) {
      return res.status(404).json({ message: `Volunteer with id ${normalizedId} not found` });
    }
    res.json(volunteer);
  } catch (err) {
    console.error('Get volunteer by id error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Export the controller(s)
module.exports = {
  createVolunteer,
  getVolunteerByEmail,
  getVolunteerById,
  updateVolunteer,
  getAllVolunteers,
  deleteVolunteer
};