const mongoose = require('mongoose');
const { volunteers, events } = require('./seedData');
const config = require('../config/mongoConfig');
const Volunteer = require('../schemas/User'); // now Volunteer
const Event = require('../schemas/Event');
const Registration = require('../schemas/Registration');
const VolunteerHours = require('../schemas/VolunteerHours');

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

const createRegistration = async (req, res) => {
  try {
    const missing = requiredFields.filter(field => !(field in req.body));
    if (missing.length > 0) {
      return res.status(400).json({
        message: `Missing required field(s): ${missing.join(', ')}`
      });
    }
    // ...existing code...
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// ...add similar checks for update/delete endpoints...