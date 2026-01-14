const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Volunteer = require('../models/Volunteer');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// Validate a date-only string in YYYY-MM-DD format
const isValidDateOnly = (val) => {
  if (!val || typeof val !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return false;
  const d = new Date(val);
  return !isNaN(d.getTime());
};

// Validate a time-only string HH:MM or HH:MM:SS
const isValidTimeOnly = (val) => {
  if (!val || typeof val !== 'string') return false;
  return /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(val);
};

// List events (public)
router.get('/', async (req, res) => {
  const events = await Event.find();
  res.json(events);
});

// Get events by title (returns array, not error page)
// <-- moved above the '/:id' route to avoid route collision
router.get('/title/:title', async (req, res) => {
  try {
    const { title } = req.params;
    
    // Validate parameter is not empty or placeholder
    if (!title || title.trim() === '' || title.startsWith(':')) {
      return res.status(400).json({ message: 'Title__c is required and cannot be empty' });
    }
    
    const events = await Event.find({ Title__c: title });
    res.json(Array.isArray(events) && events.length > 0 ? events : []);
  } catch (err) {
    console.error('Error fetching events by title:', err);
    res.status(400).json({ message: `Invalid Title__c ${req.params.title}` });
  }
});

// Get event
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const normalizedId = (id === undefined || id === null) ? '' : String(id).trim();
    if (normalizedId === '' || normalizedId === ':id' || ['undefined', 'null'].includes(normalizedId.toLowerCase())) {
      return res.status(400).json({ message: 'event id should not be empty' });
    }
    if (!mongoose.Types.ObjectId.isValid(normalizedId)) {
      return res.status(400).json({ message: `Invalid event id: ${normalizedId}` });
    }

    const e = await Event.findById(normalizedId);
    if (!e) return res.status(404).json({ message: `Event ${normalizedId} not found` });
    res.json(e);
  } catch (err) {
    console.error('Error fetching event:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create event (protected — admin only)
router.post('/', auth, async (req, res) => {
  try {
    const { Created_By__c } = req.body;

    // Pre-validate common required fields so we can return friendly 4xx messages before Mongoose runs
    const requiredFields = {
      Event_Date__c: 'Event date is required',
      Title__c: 'Event title is required',
      Event_Time__c: 'Event time is required',
      Location__c: 'Event location is required',
      Description__c: 'Event description is required',
      Created_By__c: 'Created_By__c is required and cannot be empty.'
    };
    for (const [field, msg] of Object.entries(requiredFields)) {
      const v = req.body[field];
      if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) {
        return res.status(400).json({ message: msg });
      }
    }

    // Validate Event_Date__c format (YYYY-MM-DD)
    if (!isValidDateOnly(String(req.body.Event_Date__c))) {
      return res.status(400).json({ message: `Event date is invalid: ${req.body.Event_Date__c} (expected format: YYYY-MM-DD)` });
    }
    // Validate Event_Time__c format (HH:MM or HH:MM:SS)
    if (!isValidTimeOnly(String(req.body.Event_Time__c))) {
      return res.status(400).json({ message: `Event time is invalid: ${req.body.Event_Time__c} (expected format: HH:MM or HH:MM:SS)` });
    }
  // Check if the creator is an admin
  const creator = await Volunteer.findById(Created_By__c);
    if (!creator) {
      return res.status(404).json({ message: `Created_By__c ${Created_By__c} was not found.` });
    }
    if (creator.Volunteer_Type__c !== 'Administrator') {
      return res.status(403).json({ message: `Only admins can create events. Created_By__c ${Created_By__c} is not an admin.` });
    }
    // Generate a unique name for the event (auto-number simulation)
    const count = await Event.countDocuments();
    const name = `EVT-${(count + 1).toString().padStart(4, '0')}`;
    let { event_id } = req.body;
    if (!event_id) event_id = `evt_${Date.now()}`;
    const event = new Event({ ...req.body, event_id, name });
    await event.save();
    res.status(201).json({ message: `Event ${event._id} was created sucessfully.`, event });
  } catch (err) {
    console.error(err);
    // Handle Mongoose validation errors to return friendly 4xx messages
    if (err && err.name === 'ValidationError') {
      // Specific friendly message for missing Event_Date__c
      if (err.errors && err.errors.Event_Date__c && err.errors.Event_Date__c.kind === 'required') {
        return res.status(400).json({ message: 'Event date is required' });
      }
      // Map other common required fields to friendly messages
      const fieldMap = {
        Title__c: 'Event title is required',
        Event_Time__c: 'Event time is required',
        Location__c: 'Event location is required',
        Description__c: 'Event description is required'
      };
      for (const [field, msg] of Object.entries(fieldMap)) {
        if (err.errors && err.errors[field]) return res.status(400).json({ message: msg });
      }
      // Fallback: join validation messages
      const messages = Object.values(err.errors || {}).map(e => e.message);
      return res.status(400).json({ message: messages.join('; ') });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update event
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate id first to catch missing placeholder values
    const normalizedId = (id === undefined || id === null) ? '' : String(id).trim();
    if (normalizedId === '' || normalizedId === ':id' || ['undefined', 'null'].includes(normalizedId.toLowerCase())) {
      return res.status(400).json({ message: 'event id should not be empty' });
    }
    if (!mongoose.Types.ObjectId.isValid(normalizedId)) {
      return res.status(400).json({ message: `Invalid event id: ${normalizedId}` });
    }

    const { Updated_By__c } = req.body;
    
    if (!Updated_By__c || Updated_By__c.toString().trim() === '') {
      return res.status(400).json({ message: 'Updated_By__c is required and cannot be empty.' });
    }
    const updater = await Volunteer.findById(Updated_By__c);
    if (!updater) {
      return res.status(404).json({ message: `Updated_By__c ${Updated_By__c} was not found.` });
    }
    if (updater.Volunteer_Type__c !== 'Administrator') {
      return res.status(403).json({ message: `Only admins can update events. Updated_By__c ${Updated_By__c} is not an admin.` });
    }
    const e = await Event.findByIdAndUpdate(normalizedId, req.body, { new: true });
    if (!e) return res.status(404).json({ message: `Event id ${normalizedId} not found` });
    res.json({ message: `Event ${e._id} was updated.`, event: e });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete event
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate id first
    const normalizedId = (id === undefined || id === null) ? '' : String(id).trim();
    if (normalizedId === '' || normalizedId === ':id' || ['undefined', 'null'].includes(normalizedId.toLowerCase())) {
      return res.status(400).json({ message: 'event id should not be empty' });
    }
    if (!mongoose.Types.ObjectId.isValid(normalizedId)) {
      return res.status(400).json({ message: `Invalid event id: ${normalizedId}` });
    }

    const { Deleted_By__c } = req.body;
    
    if (!Deleted_By__c || Deleted_By__c.toString().trim() === '') {
      return res.status(400).json({ message: 'Deleted_By__c is required and cannot be empty.' });
    }
    const deleter = await Volunteer.findById(Deleted_By__c);
    if (!deleter) {
      return res.status(404).json({ message: `Deleted_By__c ${Deleted_By__c} was not found.` });
    }
    if (deleter.Volunteer_Type__c !== 'Administrator') {
      return res.status(403).json({ message: `Only admins can delete events. Deleted_By__c ${Deleted_By__c} is not an admin.` });
    }
    const e = await Event.findByIdAndDelete(normalizedId);
    if (!e) return res.status(404).json({ message: `Event id ${normalizedId} not found` });
    res.json({ message: `Event ${e._id} was deleted.` });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
