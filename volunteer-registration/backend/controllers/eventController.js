const Event = require('../models/Event');

const requiredFields = [
  'Title__c',
  'Event_Date__c',
  'Event_Time__c',
  'Location__c',
  'Description__c',
  'Created_By__c',
  'Event_Status__c'
];

// Example: Creating an event
const createEvent = async (req, res) => {
  try {
    const missing = requiredFields.filter(field => !(field in req.body));
    if (missing.length > 0) {
      return res.status(400).json({
        message: `Missing required field(s): ${missing.join(', ')}`
      });
    }

    const {
      Title__c,
      Event_Date__c,
      Event_Time__c,
      Location__c,
      Description__c,
      Image_1_URL__c,
      Image_2_URL__c,
      Image_3_URL__c,
      Created_By__c,
      Created_Date__c,
      Event_Status__c,
      Max_Volunteers__c
    } = req.body;

    const event = new Event({
      name: 'EVT-000X', // generate or leave for auto-number
      Title__c,
      Event_Date__c,
      Event_Time__c,
      Location__c,
      Description__c,
      Image_1_URL__c,
      Image_2_URL__c,
      Image_3_URL__c,
      Created_By__c,
      Created_Date__c,
      Event_Status__c,
      Max_Volunteers__c
    });

    const savedEvent = await event.save();
    res.status(201).json(savedEvent);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// Example: Find event by title
const getEventByTitle = async (req, res) => {
  const { title } = req.params;
  const event = await Event.findOne({ Title__c: title });
  if (!event) return res.status(404).send('Event not found');
  res.json(event);
};

// ...existing code...