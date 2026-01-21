const Volunteer = require('../models/Volunteer');
const History = require('../models/History');
const bcrypt = require('bcrypt');

// Helper function to validate Salesforce ID format (15 or 18 characters, alphanumeric)
function isValidSalesforceId(id) {
  if (!id || typeof id !== 'string') return false;
  // Salesforce IDs are 15 or 18 characters, alphanumeric (case-sensitive)
  return /^[a-zA-Z0-9]{15}$|^[a-zA-Z0-9]{18}$/.test(id);
}

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

// Log activity to History collection (Salesforce-compatible)
async function logActivity({ schema, activity_type, user_id, activity_response }) {
  try {
    await History.create({
      Schema__c: schema,
      Activity_Type__c: activity_type,
      User__c: user_id,
      Activity_Response__c: activity_response,
      Activity_Timestamp__c: new Date().toISOString()
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

    // Remove password from req.body before spreading
    const { password, ...rest } = req.body;

    // Prepare volunteer data
    const volunteerData = {
      ...rest,
      Volunteer_Type__c: rest.Volunteer_Type__c || 'Individual',
      Status__c: rest.Status__c || 'Active'
    };

    // Hash password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      volunteerData.Pass_Hash__c = await bcrypt.hash(password, salt);
    }

    // Debug: log before create
    console.log('DEBUG volunteer before create:', volunteerData);

    // Create volunteer in Salesforce
    const result = await Volunteer.create(volunteerData);
    
    // Debug: log after create
    console.log('DEBUG volunteer after create:', result);

    await logActivity({
      schema: 'Volunteer',
      activity_type: 'create',
      user_id: result.id,
      activity_response: `User ${volunteerData.First_Name__c} ${volunteerData.Last_Name__c} was created`
    });

    res.status(201).json({
      message: `User ${volunteerData.First_Name__c} ${volunteerData.Last_Name__c} was created`,
      id: result.id
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
      user_id: req.user?.id || volunteer.Id,
      activity_response: `Volunteer ${volunteer.Id} retrieved`
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
    if (!isValidSalesforceId(normalizedId)) {
      return res.status(400).json({ message: 'Invalid volunteer id format' });
    }
    const updateFields = { ...req.body };

  // Debug: log the incoming update request
  console.log('DEBUG updateVolunteer:', { id: normalizedId, updateFields });

    // List of fields that should NOT be updated directly
    // Includes MongoDB-specific fields and Salesforce protected fields
    const protectedFields = [
      'Pass_Hash',
      'Pass_Hash__c',
      'createdAt',
      'updatedAt',
      'Registration_Date__c',
      'Offender_Policy_Confirmed__c',
      '_id',
      '__v',
      'Id',
      'id',
      'attributes'
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
      user_id: req.user?.id || volunteer.Id,
      activity_response: `Account for user ${volunteer.Id} was updated.`
    });
    res.json({ message: `Account for user ${volunteer.Id} was updated.` });
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
    if (!isValidSalesforceId(normalizedId)) {
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
    
    // findByIdAndDelete returns { id } (lowercase)
    const deletedId = volunteer.id || volunteer.Id || normalizedId;
    
    await logActivity({
      schema: 'Volunteer',
      activity_type: 'delete',
      user_id: req.user?.id || deletedId,
      activity_response: `Account for user ${deletedId} was deleted.`
    });
    res.json({ message: `Account for user ${deletedId} was deleted.` });
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

    // Validate Salesforce ID format
    if (!isValidSalesforceId(normalizedId)) {
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
