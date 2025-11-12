const express = require('express');
const router = express.Router();
const Event = require('../models/Event'); // <-- fixed path
const auth = require('../middleware/auth');

// List events (public)
router.get('/', async (req, res) => {
  const events = await Event.find();
  res.json(events);
});

// Get event
router.get('/:id', async (req, res) => {
  const e = await Event.findById(req.params.id);
  if (!e) return res.status(404).json({ message: 'Event not found' });
  res.json(e);
});

// Create event (protected — admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.type !== 'Admin') return res.status(403).json({ message: 'Only admins can create events' });
    let { event_id } = req.body;
    if (!event_id) event_id = `evt_${Date.now()}`;
    const event = new Event({ ...req.body, event_id });
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update event
router.put('/:id', auth, async (req, res) => {
  try {
    const e = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!e) return res.status(404).json({ message: 'Event not found' });
    res.json(e);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete event
router.delete('/:id', auth, async (req, res) => {
  try {
    const e = await Event.findByIdAndDelete(req.params.id);
    if (!e) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
