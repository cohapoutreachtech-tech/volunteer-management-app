const Event = require('../models/Event');
const Volunteer = require('../models/Volunteer');
const mongoose = require('mongoose');
const History = require('../models/History');

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

// Validate a time-only string HH:MM or HH:MM:SS
const isValidTimeOnly = (val) => {
  if (!val || typeof val !== 'string') return false;
  return /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(val);
};

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

    // Validate creator id format early to avoid Mongoose CastError
    if (!mongoose.Types.ObjectId.isValid(String(Created_By__c))) {
      return res.status(400).json({ message: `Invalid Created_By__c id: ${Created_By__c}` });
    }

    console.log('Checking admin status for user:', Created_By__c);

    // Authenticate admin user (catch any db-level errors and treat as not found)
    const creator = await Volunteer.findById(Created_By__c).catch(() => null);
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

    // Treat undefined/null/empty/whitespace as missing for required event fields
    const isEmpty = v => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
    if (isEmpty(Event_Date__c)) {
      return res.status(400).json({ message: 'Event date is required' });
    }
    if (isEmpty(Title__c)) return res.status(400).json({ message: 'Event title is required' });
    if (isEmpty(Event_Time__c)) return res.status(400).json({ message: 'Event time is required' });
    if (isEmpty(Location__c)) return res.status(400).json({ message: 'Event location is required' });
    if (isEmpty(Description__c)) return res.status(400).json({ message: 'Event description is required' });

    // Validate dates/times
    if (!isValidDateOnly(String(Event_Date__c))) {
      return res.status(400).json({ message: `Event date is invalid: ${Event_Date__c} (expected format: YYYY-MM-DD)` });
    }
    if (!isValidTimeOnly(String(Event_Time__c))) {
      return res.status(400).json({ message: `Event time is invalid: ${Event_Time__c} (expected format: HH:MM or HH:MM:SS)` });
    }
    if (Created_Date__c && !isValidDateTime(String(Created_Date__c))) {
      return res.status(400).json({ message: `Created date is invalid: ${Created_Date__c} (expected ISO 8601 datetime, e.g. 2024-03-01T14:30:00Z)` });
    }

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
      Created_Date__c: Created_Date__c ? new Date(Created_Date__c) : new Date(),
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
    if (!mongoose.Types.ObjectId.isValid(normalizedId)) {
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

    // Validate date/time fields if provided on update
    if ('Event_Date__c' in req.body && !isValidDateOnly(String(req.body.Event_Date__c))) {
      return res.status(400).json({ message: `Event date is invalid: ${req.body.Event_Date__c} (expected format: YYYY-MM-DD)` });
    }
    if ('Event_Time__c' in req.body && !isValidTimeOnly(String(req.body.Event_Time__c))) {
      return res.status(400).json({ message: `Event time is invalid: ${req.body.Event_Time__c} (expected format: HH:MM or HH:MM:SS)` });
    }
    if ('Created_Date__c' in req.body && req.body.Created_Date__c && !isValidDateTime(String(req.body.Created_Date__c))) {
      return res.status(400).json({ message: `Created date is invalid: ${req.body.Created_Date__c} (expected ISO 8601 datetime, e.g. 2024-03-01T14:30:00Z)` });
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
    if (!mongoose.Types.ObjectId.isValid(normalizedId)) {
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
    if (!mongoose.Types.ObjectId.isValid(normalizedId)) {
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