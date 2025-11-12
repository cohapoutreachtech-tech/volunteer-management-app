const express = require('express');
const router = express.Router();
const Volunteer = require('../models/Volunteer'); // <-- fixed path
const auth = require('../middleware/auth'); // <-- fixed path

// Get all volunteers (protected)
router.get('/', auth, async (req, res) => {
  const volunteers = await Volunteer.find().select('-password');
  res.json(volunteers);
});

// Get volunteer by id (protected)
router.get('/:id', auth, async (req, res) => {
  const v = await Volunteer.findById(req.params.id).select('-password');
  if (!v) return res.status(404).json({ message: 'Volunteer not found' });
  res.json(v);
});

// Update volunteer (protected, allow user to update their own or admin later)
router.put('/:id', auth, async (req, res) => {
  try {
    const update = { ...req.body };
    delete update.password; // password change via dedicated endpoint later

    const v = await Volunteer.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!v) return res.status(404).json({ message: 'Volunteer not found' });
    res.json(v);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete volunteer
router.delete('/:id', auth, async (req, res) => {
  try {
    const v = await Volunteer.findByIdAndDelete(req.params.id);
    if (!v) return res.status(404).json({ message: 'Volunteer not found' });
    res.json({ message: 'Volunteer deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve or reject volunteer (admin only)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    // Only admin can approve/reject
    if (req.user.type !== 'Admin') return res.status(403).json({ message: 'Only admin can approve/reject volunteers' });
    const { status } = req.body;
    if (!['active', 'rejected', 'pending_approval'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const v = await Volunteer.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-password');
    if (!v) return res.status(404).json({ message: 'Volunteer not found' });
    res.json(v);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
