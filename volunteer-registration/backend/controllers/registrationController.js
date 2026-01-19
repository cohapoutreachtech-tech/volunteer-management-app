const Registration = require('../models/Registration');
const History = require('../models/History');

const requiredFields = [
  'Volunteer__c',
  'Event__c',
  'Registration_Status__c'
];

// Helper for logging activity
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

// Example: Create Registration
const createRegistration = async (req, res) => {
  try {
    // Treat missing, null, undefined, or empty/whitespace strings as missing
    const missing = requiredFields.filter(field => {
      if (!(field in req.body)) return true;
      const val = req.body[field];
      if (val === undefined || val === null) return true;
      if (typeof val === 'string' && val.trim() === '') return true;
      return false;
    });

    if (missing.length > 0) {
      // Map internal field keys to friendly names for clearer messages
      const fieldNameMap = {
        Volunteer__c: 'Volunteer id',
        Event__c: 'Event id',
        Registration_Status__c: 'Registration status'
      };

      const friendly = missing.map(f => fieldNameMap[f] || f);

      // Build a clear message that distinguishes empty Volunteer/Event ids from other missing fields
      const emptyKeys = ['Volunteer__c', 'Event__c'];
      const emptyFriendly = missing.filter(f => emptyKeys.includes(f)).map(f => fieldNameMap[f] || f);
      const otherMissing = missing.filter(f => !emptyKeys.includes(f)).map(f => fieldNameMap[f] || f);

      const parts = [];
      if (emptyFriendly.length === 1) {
        parts.push(`${emptyFriendly[0]} is empty`);
      } else if (emptyFriendly.length === 2) {
        parts.push(`${emptyFriendly[0]} and ${emptyFriendly[1]} are empty`);
      }

      if (otherMissing.length === 1) {
        parts.push(`${otherMissing[0]} is required`);
      } else if (otherMissing.length > 1) {
        // Oxford-style join for other missing fields
        const copy = [...otherMissing];
        const last = copy.pop();
        parts.push(`${copy.join(', ')}, and ${last} are required`);
      }

      const message = parts.join('; ');
      return res.status(400).json({ message });
    }

    const registration = await Registration.create(req.body);
    await logActivity({
      schema: 'Registration',
      activity_type: 'create',
      user_id: req.user?.id || null,
      activity_response: `Registration ${registration.Name} created`
    });
    res.status(201).json(registration);
  } catch (err) {
    await logActivity({
      schema: 'Registration',
      activity_type: 'create',
      user_id: req.user?.id || null,
      activity_response: err.message
    });
    res.status(500).json({ message: 'Server error.' });
  }
};

// Example: Update Registration
const updateRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const registration = await Registration.findByIdAndUpdate(id, req.body, { new: true });
    if (!registration) {
      await logActivity({
        schema: 'Registration',
        activity_type: 'update',
        user_id: req.user?.id || null,
        activity_response: `Registration ${id} not found`
      });
      return res.status(404).json({ message: 'Registration not found' });
    }
    await logActivity({
      schema: 'Registration',
      activity_type: 'update',
      user_id: req.user?.id || null,
      activity_response: `Registration ${id} updated`
    });
    res.json({ message: `Registration ${id} updated.` });
  } catch (err) {
    await logActivity({
      schema: 'Registration',
      activity_type: 'update',
      user_id: req.user?.id || null,
      activity_response: err.message
    });
    res.status(500).json({ message: 'Server error.' });
  }
};

// Example: Delete Registration
const deleteRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const registration = await Registration.findByIdAndDelete(id);
    if (!registration) {
      await logActivity({
        schema: 'Registration',
        activity_type: 'delete',
        user_id: req.user?.id || null,
        activity_response: `Registration ${id} not found`
      });
      return res.status(404).json({ message: 'Registration not found' });
    }
    await logActivity({
      schema: 'Registration',
      activity_type: 'delete',
      user_id: req.user?.id || null,
      activity_response: `Registration ${id} deleted`
    });
    res.json({ message: `Registration ${id} deleted.` });
  } catch (err) {
    await logActivity({
      schema: 'Registration',
      activity_type: 'delete',
      user_id: req.user?.id || null,
      activity_response: err.message
    });
    res.status(500).json({ message: 'Server error.' });
  }
};

// Example: Get Registration(s)
const getRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const registration = await Registration.findById(id);
    if (!registration) {
      await logActivity({
        schema: 'Registration',
        activity_type: 'get',
        user_id: req.user?.id || null,
        activity_response: `Registration ${id} not found`
      });
      return res.status(404).json({ message: 'Registration not found' });
    }
    await logActivity({
      schema: 'Registration',
      activity_type: 'get',
      user_id: req.user?.id || null,
      activity_response: `Registration ${id} retrieved`
    });
    res.json(registration);
  } catch (err) {
    await logActivity({
      schema: 'Registration',
      activity_type: 'get',
      user_id: req.user?.id || null,
      activity_response: err.message
    });
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  createRegistration,
  updateRegistration,
  deleteRegistration,
  getRegistration
};