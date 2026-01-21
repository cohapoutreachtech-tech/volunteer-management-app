const Event = require('../models/Event');
const Volunteer = require('../models/Volunteer');
const { isValidSalesforceId } = require('../utils/idValidator');

const requiredFields = [
  'Title__c',
  'Event_Date__c',
  'Event_Time__c',
  'Location__c',
  'Description__c',
  'Created_By__c',
  'Event_Status__c'
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

// Example: Creating an event
const createEvent = async (req, res) => {
  try {
    console.log('--- [POST] /events ---');
    console.log('Request body:', req.body);

    const { Created_By__c } = req.body;
    if (!Created_By__c) {
      console.log('Missing Created_By__c');
      return res.status(400).json({ message: 'Created_By__c is required.' });
    }

    console.log('Checking admin status for user:', Created_By__c);

    // Authenticate admin user
    const creator = await Volunteer.findById(Created_By__c);
    console.log('Volunteer.findById result:', creator);

    if (!creator) {
      console.log('Creator not found for id:', Created_By__c);
      return res.status(404).json({ message: 'Creator not found.' });
    }
    console.log('Creator Volunteer_Type__c:', creator.Volunteer_Type__c);

    if (creator.Volunteer_Type__c !== 'Administrator') {
      console.log('User is not admin:', Created_By__c);
      return res.status(403).json({ message: 'Only admins can create events' });
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
    await logActivity({
      schema: 'Event',
      activity_type: 'create',
      user_id: req.user?.id || null,
      activity_response: `Event ${event.name} created`
    });
    res.status(201).json(savedEvent);
  } catch (err) {
    console.error('Create event error:', err);
    await logActivity({
      schema: 'Event',
      activity_type: 'create',
      user_id: req.user?.id || null,
      activity_response: err.message
    });
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

// Example: Update Event
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Normalize and validate id
    const normalizedId = (id === undefined || id === null) ? '' : String(id).trim();
    if (normalizedId === '' || normalizedId === ':id' || ['undefined', 'null'].includes(normalizedId.toLowerCase())) {
      return res.status(400).json({ message: 'event id should not be empty' });
    }
    if (!isValidSalesforceId(normalizedId)) {
      return res.status(400).json({ message: 'Invalid event id format' });
    }

    const { Updated_By__c } = req.body;
    if (!Updated_By__c) {
      return res.status(400).json({ message: 'Updated_By__c is required.' });
    }
    // Check if the updater is an admin
    const updater = await Volunteer.findById(Updated_By__c);
    if (!updater) {
      return res.status(404).json({ message: 'Updater not found.' });
    }
    if (updater.Volunteer_Type__c !== 'Administrator') {
      return res.status(403).json({ message: 'Only admins can update events.' });
    }

  const event = await Event.findByIdAndUpdate(normalizedId, req.body, { new: true });
    if (!event) {
      await logActivity({
        schema: 'Event',
        activity_type: 'update',
        user_id: req.user?.id || null,
        activity_response: `Event ${id} not found`
      });
      return res.status(404).json({ message: 'Event not found' });
    }
    await logActivity({
      schema: 'Event',
      activity_type: 'update',
      user_id: req.user?.id || null,
      activity_response: `Event ${id} updated`
    });
    res.json({ message: `Event ${id} was updated.` });
  } catch (err) {
    await logActivity({
      schema: 'Event',
      activity_type: 'update',
      user_id: req.user?.id || null,
      activity_response: err.message
    });
    res.status(500).json({ message: 'Server error.' });
  }
};

// Example: Delete Event
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Normalize and validate id
    const normalizedId = (id === undefined || id === null) ? '' : String(id).trim();
    if (normalizedId === '' || normalizedId === ':id' || ['undefined', 'null'].includes(normalizedId.toLowerCase())) {
      return res.status(400).json({ message: 'event id should not be empty' });
    }
    if (!isValidSalesforceId(normalizedId)) {
      return res.status(400).json({ message: 'Invalid event id format' });
    }

    const { Deleted_By__c } = req.body;
    if (!Deleted_By__c) {
      return res.status(400).json({ message: 'Deleted_By__c is required.' });
    }
    // Check if the deleter is an admin
    const deleter = await Volunteer.findById(Deleted_By__c);
    if (!deleter) {
      return res.status(404).json({ message: 'Deleter not found.' });
    }
    if (deleter.Volunteer_Type__c !== 'Administrator') {
      return res.status(403).json({ message: 'Only admins can delete events.' });
    }

  const event = await Event.findByIdAndDelete(normalizedId);
    if (!event) {
      await logActivity({
        schema: 'Event',
        activity_type: 'delete',
        user_id: req.user?.id || null,
        activity_response: `Event ${id} not found`
      });
      return res.status(404).json({ message: 'Event not found' });
    }
    await logActivity({
      schema: 'Event',
      activity_type: 'delete',
      user_id: req.user?.id || null,
      activity_response: `Event ${id} deleted`
    });
    res.json({ message: `Event ${id} was deleted.` });
  } catch (err) {
    await logActivity({
      schema: 'Event',
      activity_type: 'delete',
      user_id: req.user?.id || null,
      activity_response: err.message
    });
    res.status(500).json({ message: 'Server error.' });
  }
};

// Example: Get Event(s)
const getEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Normalize and validate id
    const normalizedId = (id === undefined || id === null) ? '' : String(id).trim();
    if (normalizedId === '' || normalizedId === ':id' || ['undefined', 'null'].includes(normalizedId.toLowerCase())) {
      return res.status(400).json({ message: 'event id should not be empty' });
    }
    if (!isValidSalesforceId(normalizedId)) {
      return res.status(400).json({ message: 'Invalid event id format' });
    }

    const event = await Event.findById(normalizedId);
    if (!event) {
      await logActivity({
        schema: 'Event',
        activity_type: 'get',
        user_id: req.user?.id || null,
        activity_response: `Event ${normalizedId} not found`
      });
      return res.status(404).json({ message: 'Event not found' });
    }
    await logActivity({
      schema: 'Event',
      activity_type: 'get',
      user_id: req.user?.id || null,
      activity_response: `Event ${id} retrieved`
    });
    res.json(event);
  } catch (err) {
    await logActivity({
      schema: 'Event',
      activity_type: 'get',
      user_id: req.user?.id || null,
      activity_response: err.message
    });
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  createEvent,
  getEventByTitle,
  updateEvent,
  deleteEvent,
  getEvent
};