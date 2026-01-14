const mongoose = require('mongoose');
const { volunteers, events } = require('./seedData');
const config = require('../config/mongoConfig');
const Volunteer = require('../schemas/User'); // now Volunteer
const Event = require('../schemas/Event');
const Registration = require('../schemas/Registration');
const VolunteerHours = require('../schemas/VolunteerHours');
const History = require('../models/History');

async function validateCollection(Model, name) {
  const count = await Model.countDocuments();
  if (count === 0) {
    throw new Error(`${name} collection is empty after seeding`);
  }
  console.log(`✅ ${name} collection validated: ${count} documents`);
}

async function initializeDB() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.mongoURI, config.options);

    // Clear existing data
    await Promise.all([
      Volunteer.deleteMany({}),
      Event.deleteMany({}),
      Registration.deleteMany({}),
      VolunteerHours.deleteMany({})
    ]);

    // Insert volunteers
    const insertedVolunteers = await Volunteer.insertMany(volunteers);

    // Insert events, set Created_By__c to admin volunteer
    events.forEach(e => e.Created_By__c = insertedVolunteers[0]._id);
    const insertedEvents = await Event.insertMany(events);

    // Create sample registration
    const sampleRegistrations = [
      {
        name: 'REG-0001',
        Volunteer__c: insertedVolunteers[1]._id,
        Event__c: insertedEvents[0]._id,
        Registration_Status__c: 'Confirmed',
        Registration_Date__c: new Date()
      }
    ];
    await Registration.insertMany(sampleRegistrations);

    // Create sample volunteer hours
    const sampleHours = [
      {
        name: 'HRS-0001',
        Volunteer__c: insertedVolunteers[1]._id,
        Event__c: insertedEvents[0]._id,
        Shift_Date__c: new Date('2024-03-15'),
        Clock_In_Time__c: new Date('2024-03-15T10:00:00.000Z'),
        Clock_Out_Time__c: new Date('2024-03-15T14:00:00.000Z'),
        Total_Hours__c: 4,
        Approval_Status__c: 'Approved',
        Approved_By__c: insertedVolunteers[0]._id,
        Approved_Date__c: new Date(),
        Submitted_Date__c: new Date('2024-03-15T14:05:00.000Z')
      }
    ];
    await VolunteerHours.insertMany(sampleHours);

    // Validate data insertion
    await Promise.all([
      validateCollection(Volunteer, 'Volunteers'),
      validateCollection(Event, 'Events'),
      validateCollection(Registration, 'Registrations'),
      validateCollection(VolunteerHours, 'VolunteerHours')
    ]);

    console.log('✨ Database initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Run initialization if this script is run directly
if (require.main === module) {
  initializeDB();
}

module.exports = initializeDB;

const requiredFields = [
  'Volunteer__c',
  'Event__c',
  'Registration_Status__c'
];

// Helper for logging activity
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

// Validate a date-only string in YYYY-MM-DD format
const isValidDateOnly = (val) => {
  if (!val || typeof val !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return false;
  const d = new Date(val);
  return !isNaN(d.getTime());
};

// Validate an ISO-like datetime string that includes a time portion
const isValidDateTime = (val) => {
  if (!val || typeof val !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+\-]\d{2}:?\d{2})?$/.test(val)) return false;
  const t = Date.parse(val);
  return !isNaN(t);
};

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

    // Validate optional date fields (fail fast with clear messages)
    if ('Registration_Date__c' in req.body && !isValidDateOnly(String(req.body.Registration_Date__c))) {
      return res.status(400).json({ message: `Registration date is invalid: ${req.body.Registration_Date__c} (expected format: YYYY-MM-DD)` });
    }
    if ('Created_Date__c' in req.body && !isValidDateTime(String(req.body.Created_Date__c))) {
      return res.status(400).json({ message: `Created date is invalid: ${req.body.Created_Date__c} (expected ISO 8601 datetime, e.g. 2024-03-01T14:30:00Z)` });
    }
    if ('Clock_In_Time__c' in req.body && !isValidDateTime(String(req.body.Clock_In_Time__c))) {
      return res.status(400).json({ message: `Clock in time is invalid: ${req.body.Clock_In_Time__c} (expected ISO 8601 datetime, e.g. 2024-03-01T14:30:00Z)` });
    }
    if ('Clock_Out_Time__c' in req.body && req.body.Clock_Out_Time__c && !isValidDateTime(String(req.body.Clock_Out_Time__c))) {
      return res.status(400).json({ message: `Clock out time is invalid: ${req.body.Clock_Out_Time__c} (expected ISO 8601 datetime, e.g. 2024-03-01T14:30:00Z)` });
    }

    const registration = new Registration(req.body);
    await registration.save();
    await logActivity({
      schema: 'Registration',
      activity_type: 'create',
      user_id: req.user?.id || null,
      activity_response: `Registration ${registration.name} created`
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
    // Validate any provided date fields on update
    if ('Registration_Date__c' in req.body && !isValidDateOnly(String(req.body.Registration_Date__c))) {
      return res.status(400).json({ message: `Registration date is invalid: ${req.body.Registration_Date__c} (expected format: YYYY-MM-DD)` });
    }
    if ('Created_Date__c' in req.body && !isValidDateTime(String(req.body.Created_Date__c))) {
      return res.status(400).json({ message: `Created date is invalid: ${req.body.Created_Date__c} (expected ISO 8601 datetime, e.g. 2024-03-01T14:30:00Z)` });
    }
    if ('Clock_In_Time__c' in req.body && !isValidDateTime(String(req.body.Clock_In_Time__c))) {
      return res.status(400).json({ message: `Clock in time is invalid: ${req.body.Clock_In_Time__c} (expected ISO 8601 datetime, e.g. 2024-03-01T14:30:00Z)` });
    }
    if ('Clock_Out_Time__c' in req.body && req.body.Clock_Out_Time__c && !isValidDateTime(String(req.body.Clock_Out_Time__c))) {
      return res.status(400).json({ message: `Clock out time is invalid: ${req.body.Clock_Out_Time__c} (expected ISO 8601 datetime, e.g. 2024-03-01T14:30:00Z)` });
    }

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

// ...export all handlers as needed...