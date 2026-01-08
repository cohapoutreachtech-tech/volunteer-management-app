const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Volunteer = require('../models/Volunteer');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// List registrations (protected)
router.get('/', auth, async (req, res) => {
  try {
    const registrations = await Registration.find()
      .populate('Volunteer__c')
      .populate('Event__c');
    res.json(registrations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create registration
router.post('/', auth, async (req, res) => {
  try {
    const { Volunteer__c, Event__c } = req.body;
    if (!Volunteer__c || !Event__c) {
      return res.status(400).json({ message: 'Volunteer__c and Event__c are required' });
    }

    const event = await Event.findById(Event__c);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const volunteer = await Volunteer.findById(Volunteer__c);
    if (!volunteer) return res.status(404).json({ message: `Volunteer ${Volunteer__c} not found` });

    // Check for duplicate registration
    const existing = await Registration.findOne({ Volunteer__c, Event__c });
    if (existing) return res.status(400).json({ message: 'Already registered for this event' });

    const count = await Registration.countDocuments();
    const name = `REG-${(count + 1).toString().padStart(4, '0')}`;

    const reg = new Registration({ name, Volunteer__c, Event__c });
    await reg.save();
    const result = await Registration.findById(reg._id).populate('Volunteer__c').populate('Event__c');
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get registration
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    // treat placeholders like ':id' as empty
    if (!id || id.trim() === '' || id.startsWith(':')) {
      return res.status(400).json({ message: 'registration id is required and cannot be empty' });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: `Invalid registration id: ${id}` });
    }
    const r = await Registration.findById(id).populate('Volunteer__c').populate('Event__c');
    if (!r) return res.status(404).json({ message: `Registration ${id} not found` });
    res.json(r);
  } catch (err) {
    console.error('Error fetching registration:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get registration by event and volunteer
router.get('/:volunteerId/:eventId', auth, async (req, res) => {
  try {
    const { volunteerId, eventId } = req.params;

    // treat placeholders like ':volunteerId' or ':eventId' as empty
    if (!volunteerId || volunteerId.trim() === '' || volunteerId.startsWith(':')) {
      return res.status(400).json({ message: 'volunteerId parameter is required and cannot be empty' });
    }
    if (!eventId || eventId.trim() === '' || eventId.startsWith(':')) {
      return res.status(400).json({ message: 'eventId parameter is required and cannot be empty' });
    }

    // Only check ObjectId if not empty
    if (!mongoose.Types.ObjectId.isValid(volunteerId)) {
      return res.status(400).json({ message: `Invalid Volunteer__c ${volunteerId}` });
    }
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: `Invalid Event__c ${eventId}` });
    }
    
    // Validate volunteer exists
    const volunteer = await Volunteer.findById(volunteerId);
    if (!volunteer) {
      return res.status(400).json({ 
        message: `Invalid Volunteer__c ${volunteerId}` 
      });
    }
    
    // Validate event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(400).json({ 
        message: `Invalid Event__c ${eventId}` 
      });
    }
    
    const r = await Registration.findOne({ 
      Volunteer__c: volunteerId, 
      Event__c: eventId 
    }).populate('Volunteer__c').populate('Event__c');
    
    if (!r) {
      return res.status(404).json({ 
        message: `Registration not found for Volunteer__c ${volunteerId} and Event__c ${eventId}` 
      });
    }
    res.json(r);
  } catch (err) {
    console.error('Error fetching registration:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get registrations by event id
router.get('/event/:eventId', auth, async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!eventId || eventId.trim() === '' || eventId.startsWith(':')) {
      return res.status(400).json({ message: 'Event__c is required and cannot be empty' });
    }
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: `Invalid Event__c ${eventId}` });
    }
    
    const registrations = await Registration.find({ Event__c: eventId })
      .populate('Volunteer__c')
      .populate('Event__c');
    if (!registrations || registrations.length === 0) {
      return res.status(404).json({ 
        message: `No registrations found for Event__c ${eventId}` 
      });
    }
    res.json(registrations);
  } catch (err) {
    console.error('Error fetching registrations by event:', err);
    res.status(400).json({ 
      message: `Invalid Event__c ${req.params.eventId}` 
    });
  }
});

// Get all events a volunteer is registered to
router.get('/volunteer/:volunteerId/events', auth, async (req, res) => {
  try {
    const { volunteerId } = req.params;
    if (!volunteerId || volunteerId.trim() === '' || volunteerId.startsWith(':')) {
      return res.status(400).json({ message: 'Volunteer__c is required and cannot be empty' });
    }
    if (!mongoose.Types.ObjectId.isValid(volunteerId)) {
      return res.status(400).json({ message: `Invalid Volunteer__c ${volunteerId}` });
    }
    
    const registrations = await Registration.find({ Volunteer__c: volunteerId })
      .populate('Event__c');
    if (!registrations || registrations.length === 0) {
      return res.status(200).json({ 
        message: `No events found for Volunteer__c ${volunteerId}`,
        events: []
      });
    }
    const events = registrations.map(reg => reg.Event__c);
    res.json({ 
      message: `Found ${events.length} event(s) for Volunteer__c ${volunteerId}`,
      events 
    });
  } catch (err) {
    console.error('Error fetching events for volunteer:', err);
    res.status(400).json({ 
      message: `Invalid Volunteer__c ${req.params.volunteerId}` 
    });
  }
});

// Get all registrations for a volunteer
router.get('/volunteer/:volunteerId/registrations', auth, async (req, res) => {
  try {
    const { volunteerId } = req.params;
    if (!volunteerId || volunteerId.trim() === '' || volunteerId.startsWith(':')) {
      return res.status(400).json({ message: 'Volunteer__c is required and cannot be empty' });
    }
    if (!mongoose.Types.ObjectId.isValid(volunteerId)) {
      return res.status(400).json({ 
        message: `Invalid Volunteer__c ${volunteerId}` 
      });
    }
    
    const registrations = await Registration.find({ Volunteer__c: volunteerId })
      .populate('Volunteer__c')
      .populate('Event__c');
    if (!registrations || registrations.length === 0) {
      return res.status(200).json({ 
        message: `No registrations found for Volunteer__c ${volunteerId}`,
        registrations: []
      });
    }
    res.json({ 
      message: `Found ${registrations.length} registration(s) for Volunteer__c ${volunteerId}`,
      registrations 
    });
  } catch (err) {
    console.error('Error fetching registrations for volunteer:', err);
    res.status(400).json({ 
      message: `Invalid Volunteer__c ${req.params.volunteerId}` 
    });
  }
});

// Delete registration
router.delete('/:id', auth, async (req, res) => {
  try {
    const r = await Registration.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ message: 'Registration not found' });
    res.json({ message: 'Registration deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Check if volunteer is registered for event
router.get('/check/:volunteerId/:eventId', auth, async (req, res) => {
  try {
    const { volunteerId, eventId } = req.params;
    if (!volunteerId || volunteerId.trim() === '' || volunteerId.startsWith(':')) {
      return res.status(200).json({
        message: 'Volunteer__c is required and cannot be empty',
        exists: false,
        registration: null
      });
    }
    if (!eventId || eventId.trim() === '' || eventId.startsWith(':')) {
      return res.status(200).json({
        message: 'Event__c is required and cannot be empty',
        exists: false,
        registration: null
      });
    }
    // Only check ObjectId if not empty
    if (!mongoose.Types.ObjectId.isValid(volunteerId)) {
      return res.status(200).json({
        message: `Invalid Volunteer__c ${volunteerId}`,
        exists: false,
        registration: null
      });
    }
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(200).json({
        message: `Invalid Event__c ${eventId}`,
        exists: false,
        registration: null
      });
    }
    
    // Validate volunteer exists
    const volunteer = await Volunteer.findById(volunteerId);
    if (!volunteer) {
      return res.status(200).json({ 
        message: `Invalid Volunteer__c ${volunteerId}`,
        exists: false,
        registration: null
      });
    }
    
    // Validate event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(200).json({ 
        message: `Invalid Event__c ${eventId}`,
        exists: false,
        registration: null
      });
    }
    
    const registration = await Registration.findOne({ 
      Volunteer__c: volunteerId, 
      Event__c: eventId 
    }).populate('Volunteer__c').populate('Event__c');
    
    if (!registration) {
      return res.status(200).json({ 
        message: `No registration found for Volunteer__c ${volunteerId} and Event__c ${eventId}`,
        exists: false,
        registration: null
      });
    }
    res.json({ 
      message: `Registration found for Volunteer__c ${volunteerId} and Event__c ${eventId}`,
      exists: true,
      registration 
    });
  } catch (err) {
    console.error('Error checking registration:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
