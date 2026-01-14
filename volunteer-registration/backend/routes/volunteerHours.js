const express = require('express');
const router = express.Router();
const vc = require('../controllers/volunteerHoursController');
const auth = require('../middleware/auth');

// Create a new shift
router.post('/', auth, vc.createShift);

// Get all shifts
// Support query params: ?eventId=, ?volunteerId= (validate presence, format, and existence)
router.get('/', auth, async (req, res, next) => {
	try {
	// Accept either eventId/eventid, volunteerId/volunteerid, or shiftId/shiftid (common client variances)
	const rawEventId = Object.prototype.hasOwnProperty.call(req.query, 'eventId') ? req.query.eventId : (Object.prototype.hasOwnProperty.call(req.query, 'eventid') ? req.query.eventid : undefined);
	const rawVolunteerId = Object.prototype.hasOwnProperty.call(req.query, 'volunteerId') ? req.query.volunteerId : (Object.prototype.hasOwnProperty.call(req.query, 'volunteerid') ? req.query.volunteerid : undefined);
	const rawShiftId = Object.prototype.hasOwnProperty.call(req.query, 'shiftId') ? req.query.shiftId : (Object.prototype.hasOwnProperty.call(req.query, 'shiftid') ? req.query.shiftid : undefined);

		// If a param is present but empty, return 400. If multiple are present and empty, return a combined message.
		const empties = [];
		if (rawEventId !== undefined && (rawEventId === null || String(rawEventId).trim() === '')) empties.push('event id');
		if (rawVolunteerId !== undefined && (rawVolunteerId === null || String(rawVolunteerId).trim() === '')) empties.push('volunteer id');
		if (rawShiftId !== undefined && (rawShiftId === null || String(rawShiftId).trim() === '')) empties.push('shift id');
		if (empties.length > 0) {
			let message;
			if (empties.length === 1) message = `${empties[0]} query parameter is required and cannot be empty`;
			else if (empties.length === 2) message = `${empties[0]} and ${empties[1]} query parameters are required and cannot be empty`;
			else message = `${empties.slice(0, -1).join(', ')}, and ${empties.slice(-1)[0]} query parameters are required and cannot be empty`;
			return res.status(400).json({ message });
		}

		const eventId = rawEventId !== undefined ? String(rawEventId).trim() : undefined;
		const volunteerId = rawVolunteerId !== undefined ? String(rawVolunteerId).trim() : undefined;
		const shiftId = rawShiftId !== undefined ? String(rawShiftId).trim() : undefined;

		// If only shiftId provided, return the single shift or 404 with friendly message
		if (shiftId !== undefined) {
			const mongoose = require('mongoose');
			const VolunteerHours = require('../models/VolunteerHours');
			if (!mongoose.Types.ObjectId.isValid(shiftId)) return res.status(404).json({ message: `shift id ${shiftId} was not found` });
			const sh = await VolunteerHours.findById(shiftId).catch(() => null);
			if (!sh) return res.status(404).json({ message: `shift id ${shiftId} was not found` });
			return res.json(sh);
		}

		// If both provided, validate and forward to getShiftsByEventVolunteer
		if (eventId !== undefined && volunteerId !== undefined) {
			const mongoose = require('mongoose');
			const Event = require('../models/Event');
			const Volunteer = require('../models/Volunteer');
			if (!mongoose.Types.ObjectId.isValid(eventId)) return res.status(404).json({ message: `Event ${eventId} not found` });
			if (!mongoose.Types.ObjectId.isValid(volunteerId)) return res.status(404).json({ message: `Volunteer ${volunteerId} not found` });
			const [ev, vol] = await Promise.all([Event.findById(eventId).catch(() => null), Volunteer.findById(volunteerId).catch(() => null)]);
			if (!ev) return res.status(404).json({ message: `Event ${eventId} not found` });
			if (!vol) return res.status(404).json({ message: `Volunteer ${volunteerId} not found` });
			req.params.eventId = eventId;
			req.params.volunteerId = volunteerId;
			return vc.getShiftsByEventVolunteer(req, res, next);
		}

		// If only eventId provided
		if (eventId !== undefined) {
			const mongoose = require('mongoose');
			const Event = require('../models/Event');
			if (!mongoose.Types.ObjectId.isValid(eventId)) return res.status(404).json({ message: `Event ${eventId} not found` });
			const ev = await Event.findById(eventId).catch(() => null);
			if (!ev) return res.status(404).json({ message: `Event ${eventId} not found` });
			req.params.eventId = eventId;
			return vc.getShiftsByEvent(req, res, next);
		}

		// If only volunteerId provided
		if (volunteerId !== undefined) {
			const mongoose = require('mongoose');
			const Volunteer = require('../models/Volunteer');
			if (!mongoose.Types.ObjectId.isValid(volunteerId)) return res.status(404).json({ message: `Volunteer ${volunteerId} not found` });
			const vol = await Volunteer.findById(volunteerId).catch(() => null);
			if (!vol) return res.status(404).json({ message: `Volunteer ${volunteerId} not found` });
			req.params.volunteerId = volunteerId;
			return vc.getShiftsByVolunteer(req, res, next);
		}

		// No relevant query params — forward to controller to return all shifts
		return vc.getAllShifts(req, res, next);
	} catch (err) {
		next(err);
	}
});

// Support PUT /volunteerhours?id=... (some clients send id as query param)
router.put('/', auth, async (req, res, next) => {
	try {
		const id = req.query.id || req.body.id;
		if (!id || String(id).trim() === '' || String(id).startsWith(':')) {
			return res.status(400).json({ message: 'volunteer hours id is required (path or ?id query param)' });
		}
		// forward to the existing update handler by setting params
		req.params.id = id;
		return vc.updateShift(req, res, next);
	} catch (err) {
		next(err);
	}
});

// Update shift
router.put('/:id', auth, vc.updateShift);

// Delete shift
router.delete('/:id', auth, vc.deleteShift);

// Support DELETE /volunteerhours?id=... (some clients send id as query param)
router.delete('/', auth, async (req, res, next) => {
	try {
		const id = req.query.id || req.body.id;
		if (!id || String(id).trim() === '' || String(id).startsWith(':')) {
			return res.status(400).json({ message: 'volunteer hours id is required (path or ?id query param)' });
		}
		req.params.id = id;
		return vc.deleteShift(req, res, next);
	} catch (err) {
		next(err);
	}
});

// Get shifts by event
router.get('/event/:eventId', auth, vc.getShiftsByEvent);

// Get shifts by volunteer
router.get('/volunteer/:volunteerId', auth, vc.getShiftsByVolunteer);

// Get shifts by event and volunteer
router.get('/event/:eventId/volunteer/:volunteerId', auth, vc.getShiftsByEventVolunteer);

module.exports = router;
