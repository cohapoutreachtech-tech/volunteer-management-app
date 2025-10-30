const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration'); // <-- fixed path
const Event = require('../models/Event'); // <-- fixed path
const Volunteer = require('../models/Volunteer'); // <-- fixed path
const auth = require('../middleware/auth'); // <-- fixed path

// List registrations (protected)
router.get('/', auth, async (req, res) => {
  const regs = await Registration.find().populate('user_id', '-password').populate('event_id');
  res.json(regs);
});

// Create registration: checks event active, shift exists, capacity not exceeded
router.post('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { eventId, shift_time } = req.body;
    if (!eventId || !shift_time) return res.status(400).json({ message: 'eventId and shift_time are required' });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.event_status !== 'active') return res.status(400).json({ message: 'Event is not active' });
    if (!event.shift_times || !event.shift_times.includes(shift_time)) return res.status(400).json({ message: 'Shift time not available for this event' });

    // Count existing registrations for this event+shift
    const count = await Registration.countDocuments({ event_id: event._id, shift_time });
    if (event.max_volunteers > 0 && count >= event.max_volunteers) {
      return res.status(400).json({ message: 'Shift is full' });
    }

    // Prevent duplicate registration by same user for same event+shift
    const already = await Registration.findOne({ user_id: userId, event_id: event._id, shift_time });
    if (already) return res.status(400).json({ message: 'Already registered for this shift' });

    const volunteer = await Volunteer.findById(userId);
    if (!volunteer) return res.status(404).json({ message: 'Volunteer not found' });

    const reg = new Registration({ user_id: userId, event_id: event._id, shift_time });
    await reg.save();
    const ret = await Registration.findById(reg._id).populate('user_id', '-password').populate('event_id');
    res.status(201).json(ret);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get registration
router.get('/:id', auth, async (req, res) => {
  const r = await Registration.findById(req.params.id).populate('user_id', '-password').populate('event_id');
  if (!r) return res.status(404).json({ message: 'Registration not found' });
  res.json(r);
});

// Delete registration (user can cancel their own or admin can delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const r = await Registration.findById(req.params.id);
    if (!r) return res.status(404).json({ message: 'Registration not found' });
    // allow only owner to delete in this simple scaffold
    if (r.user_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized to cancel this registration' });
    await r.remove();
    res.json({ message: 'Registration cancelled' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
