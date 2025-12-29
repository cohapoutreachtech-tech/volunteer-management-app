const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Volunteer = require('../models/Volunteer');
const auth = require('../middleware/auth');

// List events (public)
router.get('/', async (req, res) => {
  const events = await Event.find();
  res.json(events);
});

// Get event
router.get('/:id', async (req, res) => {
  try {
    const e = await Event.findById(req.params.id);
    if (!e) return res.status(404).json({ message: `Event ${req.params.id} not found` });
    res.json(e);
  } catch (err) {
    console.error('Error fetching event:', err);
    res.status(400).json({ message: `Invalid event id: ${req.params.id}` });
  }
});

// Get events by title (returns array, not error page)
router.get('/title/:title', async (req, res) => {
  try {
    const events = await Event.find({ Title__c: req.params.title });
    res.json(Array.isArray(events) && events.length > 0 ? events : []);
  } catch (err) {
    console.error('Error fetching events by title:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create event (protected — admin only)
router.post('/', auth, async (req, res) => {
  try {
    const { Created_By__c } = req.body;
    if (!Created_By__c) {
      return res.status(400).json({ message: 'Created_By__c is required.' });
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
    res.status(500).json({ message: 'Server error' });
  }
});

// Update event
router.put('/:id', auth, async (req, res) => {
  try {
    const { Updated_By__c } = req.body;
    if (!Updated_By__c) {
      return res.status(400).json({ message: 'Updated_By__c is required.' });
    }
    const updater = await Volunteer.findById(Updated_By__c);
    if (!updater) {
      return res.status(404).json({ message: `Updated_By__c ${Updated_By__c} was not found.` });
    }
    if (updater.Volunteer_Type__c !== 'Administrator') {
      return res.status(403).json({ message: `Only admins can update events. Updated_By__c ${Updated_By__c} is not an admin.` });
    }
    const e = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!e) return res.status(404).json({ message: `Event id ${req.params.id} not found` });
    res.json({ message: `Event ${e._id} was updated.`, event: e });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete event
router.delete('/:id', auth, async (req, res) => {
  try {
    const { Deleted_By__c } = req.body;
    if (!Deleted_By__c) {
      return res.status(400).json({ message: 'Deleted_By__c is required.' });
    }
    const deleter = await Volunteer.findById(Deleted_By__c);
    if (!deleter) {
      return res.status(404).json({ message: `Deleted_By__c ${Deleted_By__c} was not found.` });
    }
    if (deleter.Volunteer_Type__c !== 'Administrator') {
      return res.status(403).json({ message: `Only admins can delete events. Deleted_By__c ${Deleted_By__c} is not an admin.` });
    }
    const e = await Event.findByIdAndDelete(req.params.id);
    if (!e) return res.status(404).json({ message: `Event id ${req.params.id} not found` });
    res.json({ message: `Event ${e._id} was deleted.` });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
