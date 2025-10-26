const mongoose = require('mongoose');
const { users, events } = require('./seedData');
const config = require('../config/mongoConfig');
const User = require('../schemas/User');
const Event = require('../schemas/Event');
const Registration = require('../schemas/Registration');

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
      User.deleteMany({}),
      Event.deleteMany({}),
      Registration.deleteMany({})
    ]);
    
    // Insert seed data
    const insertedUsers = await User.insertMany(users);
    const insertedEvents = await Event.insertMany(events);
    
    // Create some sample registrations
    const sampleRegistrations = [
      {
        userId: insertedUsers[1]._id, // John Volunteer
        eventId: insertedEvents[0]._id, // Community Cleanup
        status: 'approved'
      }
    ];
    await Registration.insertMany(sampleRegistrations);
    
    // Validate data insertion
    await Promise.all([
      validateCollection(User, 'Users'),
      validateCollection(Event, 'Events'),
      validateCollection(Registration, 'Registrations')
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
