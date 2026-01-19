const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Volunteer = require('../models/Volunteer');
const auth = require('../middleware/auth');
const { isValidSalesforceId } = require('../utils/idValidator');

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
    if (!isValidSalesforceId(normalizedId)) {
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
    
    if (!Created_By__c || Created_By__c.toString().trim() === '') {
      return res.status(400).json({ message: 'Created_By__c is required and cannot be empty.' });
    }
    // Check if the creator is an admin
    const creator = await Volunteer.findById(Created_By__c);
    if (!creator) {
      return res.status(404).json({ message: `Created_By__c ${Created_By__c} was not found.` });
    }
    if (creator.Volunteer_Type__c !== 'Administrator') {
      return res.status(403).json({ message: `Only admins can create events. Created_By__c ${Created_By__c} is not an admin.` });
    }
    
    // Prepare event data for Salesforce
    const eventData = {
      ...req.body,
      Created_Date__c: new Date().toISOString(),
      Event_Status__c: req.body.Event_Status__c || 'Published'
    };
    
    // Create event in Salesforce
    const result = await Event.create(eventData);
    
    res.status(201).json({ 
      message: `Event ${result.id} was created successfully.`, 
      event: { id: result.id, ...eventData } 
    });
  } catch (err) {
    console.error(err);
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
    if (!isValidSalesforceId(normalizedId)) {
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
    
    // Check if event exists first
    const existing = await Event.findById(normalizedId);
    if (!existing) return res.status(404).json({ message: `Event id ${normalizedId} not found` });
    
    // Filter out MongoDB-specific and system fields, plus validation-only fields
    const updateData = { ...req.body };
    delete updateData.updatedAt;
    delete updateData.createdAt;
    delete updateData._id;
    delete updateData.__v;
    delete updateData.Id;
    delete updateData.id;
    delete updateData.attributes;
    delete updateData.Updated_By__c;  // This is for validation only, not a real Salesforce field
    
    console.log('DEBUG updateEvent:', { id: normalizedId, updateData });
    
    const e = await Event.findByIdAndUpdate(normalizedId, updateData);
    res.json({ message: `Event ${normalizedId} was updated.`, event: e });
  } catch (err) {
    console.error('Error updating event:', err);
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
    if (!isValidSalesforceId(normalizedId)) {
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
    
    // findByIdAndDelete returns { id } (lowercase)
    const deletedId = e.id || e.Id || normalizedId;
    res.json({ message: `Event ${deletedId} was deleted.` });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
