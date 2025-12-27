const Volunteer = require('../models/Volunteer');
const bcrypt = require('bcrypt');

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

    // Debug: log after save
    console.log('DEBUG volunteer after save:', volunteer);

    res.status(201).json({
      message: `User ${volunteer.First_Name__c} ${volunteer.Last_Name__c} was created`,
      id: volunteer._id
    });
  } catch (err) {
    console.error('Create volunteer error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Example: Find volunteer by email
const getVolunteerByEmail = async (req, res) => {
  try {
    if (!req.params.email || typeof req.params.email !== 'string') {
      return res.status(400).json({ message: 'Bad request: Email is required.' });
    }

    const { email } = req.params;
    const volunteer = await Volunteer.findOne({ Email__c: email });
    if (!volunteer) {
      return res.status(404).json({ message: `Volunteer with email${email} not found` });
    }
    res.json(volunteer);
  } catch (err) {
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
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid or missing volunteer id.' });
    }
    const updateFields = { ...req.body };

    // Debug: log the incoming update request
    console.log('DEBUG updateVolunteer:', { id, updateFields });

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
    const volunteer = await Volunteer.findByIdAndUpdate(id, updateFields, { new: true });
    if (!volunteer) {
      return res.status(404).json({ message: `Volunteer with id ${id} not found` });
    }
    res.json({ message: `Account for user ${volunteer._id} was updated.` });
  } catch (err) {
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
    if (!req.params.id || typeof req.params.id !== 'string') {
      return res.status(400).json({ message: 'Bad request: Volunteer id is required.' });
    }

    const { id } = req.params;
    const volunteer = await Volunteer.findByIdAndDelete(id);
    if (!volunteer) {
      return res.status(404).json({ message: `Volunteer with id ${id} not found` });
    }
    res.json({ message: `Account for user ${volunteer._id} was deleted.` });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get all volunteers
const getAllVolunteers = async (req, res) => {
  try {
    const volunteers = await Volunteer.find({});
    res.json(volunteers);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};


// Get volunteer by ID
const getVolunteerById = async (req, res) => {
  try {
    const { id } = req.params;
    const volunteer = await Volunteer.findById(id);
    if (!volunteer) {
      return res.status(404).json({ message: `Volunteer with id ${id} not found` });
    }
    res.json(volunteer);
  } catch (err) {
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