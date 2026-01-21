const express = require('express');
const router = express.Router();
const vc = require('../controllers/volunteerHoursController');
const auth = require('../middleware/auth');

// Create a new shift
router.post('/', auth, vc.createShift);

// Get all shifts
router.get('/', auth, vc.getAllShifts);

// Update shift
router.put('/:id', auth, vc.updateShift);

// Delete shift
router.delete('/:id', auth, vc.deleteShift);

// Get shifts by event
router.get('/event/:eventId', auth, vc.getShiftsByEvent);

// Get shifts by volunteer
router.get('/volunteer/:volunteerId', auth, vc.getShiftsByVolunteer);

// Get shifts by event and volunteer
router.get('/event/:eventId/volunteer/:volunteerId', auth, vc.getShiftsByEventVolunteer);

module.exports = router;
