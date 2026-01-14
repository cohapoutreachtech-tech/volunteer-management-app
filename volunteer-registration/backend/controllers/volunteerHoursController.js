const mongoose = require('mongoose');
const VolunteerHours = require('../models/VolunteerHours');
const History = require('../models/History');

async function logActivity({ schema, activity_type, user_id, activity_response }) {
  try {
    await History.create({ schema, activity_type, user_id, activity_response });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

const computeTotalHours = (inTime, outTime) => {
  if (!inTime || !outTime) return undefined;
  const diffMs = new Date(outTime) - new Date(inTime);
  if (isNaN(diffMs) || diffMs < 0) return undefined;
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // hours, 2 decimals
};

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
  // Require date portion plus time (T or space and HH:MM)
  if (!/^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+\-]\d{2}:?\d{2})?$/.test(val)) return false;
  const t = Date.parse(val);
  return !isNaN(t);
};

// POST /volunteerhours - create a new shift entry
const createShift = async (req, res) => {
  try {
    const {
      Volunteer__c,
      Event__c,
      Shift_Date__c,
      Clock_In_Time__c,
      Clock_Out_Time__c,
      Notes__c
    } = req.body;

    // Treat undefined/null/empty/whitespace as empty and report exactly which required fields are empty
    const isEmpty = v => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
    // Make Event__c required as well: shifts must be associated with an event
    const required = ['Volunteer__c', 'Event__c', 'Shift_Date__c', 'Clock_In_Time__c'];
    const fieldNameMap = {
      Volunteer__c: 'Volunteer id',
      Event__c: 'Event id',
      Shift_Date__c: 'Shift date',
      Clock_In_Time__c: 'Clock in time'
    };
    const empty = required.filter(k => isEmpty(req.body[k])).map(k => fieldNameMap[k] || k);
    if (empty.length > 0) {
      let message;
      if (empty.length === 1) message = `${empty[0]} is empty`;
      else if (empty.length === 2) message = `${empty[0]} and ${empty[1]} are empty`;
      else {
        const copy = [...empty];
        const last = copy.pop();
        message = `${copy.join(', ')}, and ${last} are empty`;
      }
      return res.status(400).json({ message });
    }

    // Date validations
    if (!isValidDateOnly(String(Shift_Date__c))) {
      return res.status(400).json({ message: `Shift date is invalid: ${Shift_Date__c} (expected format: YYYY-MM-DD)` });
    }
    if (!isValidDateTime(String(Clock_In_Time__c))) {
      return res.status(400).json({ message: `Clock in time is invalid: ${Clock_In_Time__c} (expected ISO 8601 datetime, e.g. 2024-03-01T14:30:00Z)` });
    }
    if (Clock_Out_Time__c && !isValidDateTime(String(Clock_Out_Time__c))) {
      return res.status(400).json({ message: `Clock out time is invalid: ${Clock_Out_Time__c} (expected ISO 8601 datetime, e.g. 2024-03-01T14:30:00Z)` });
    }

    // Normalize IDs (trim) before validation so whitespace doesn't cause a format error
    const volId = Volunteer__c ? String(Volunteer__c).trim() : '';
    const eventId = Event__c ? String(Event__c).trim() : '';

    // Attempt to find event and volunteer — if not present, return 404 (prefer 'not found' over 'invalid format')
    let eventExists;
    try {
      eventExists = await require('../models/Event').findById(eventId);
    } catch (err) {
      // Could be a CastError; still return not found to the client for UX consistency
      return res.status(404).json({ message: `Event ${eventId} not found` });
    }
    if (!eventExists) return res.status(404).json({ message: `Event ${eventId} not found` });

    let volunteerExists;
    try {
      volunteerExists = await require('../models/Volunteer').findById(volId);
    } catch (err) {
      return res.status(404).json({ message: `Volunteer ${volId} not found` });
    }
    if (!volunteerExists) return res.status(404).json({ message: `Volunteer ${volId} not found` });

    const count = await VolunteerHours.countDocuments();
    const name = `HRS-${(count + 1).toString().padStart(4, '0')}`;

    const inDate = new Date(Clock_In_Time__c);
    const outDate = Clock_Out_Time__c ? new Date(Clock_Out_Time__c) : undefined;

    const total = computeTotalHours(inDate, outDate);

    const shift = new VolunteerHours({
      name,
      Volunteer__c: volId,
      Event__c: eventId,
      Shift_Date__c: new Date(Shift_Date__c),
      Clock_In_Time__c: inDate,
      Clock_Out_Time__c: outDate,
      Total_Hours__c: typeof total !== 'undefined' ? total : 0,
      Submitted_Date__c: new Date(),
      Notes__c: Notes__c || undefined,
      Approval_Status__c: 'Pending'
    });

    await shift.save();
    await logActivity({ schema: 'VolunteerHours', activity_type: 'create', user_id: req.user?.id || null, activity_response: `VolunteerHours ${shift._id} created` });
    res.status(201).json({ message: `VolunteerHours ${shift._id} created`, shift });
  } catch (err) {
    console.error('Create shift error:', err);
    await logActivity({ schema: 'VolunteerHours', activity_type: 'create', user_id: req.user?.id || null, activity_response: err.message });
    res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /volunteerhours/:id - volunteer updates allowed fields on shift
const updateShift = async (req, res) => {
  try {
    const { id } = req.params;
    const normalizedId = (id === undefined || id === null) ? '' : String(id).trim();
    if (normalizedId === '' || normalizedId === ':id' || ['undefined', 'null'].includes(normalizedId.toLowerCase())) {
      return res.status(400).json({ message: 'volunteer hours id should not be empty' });
    }
    if (!mongoose.Types.ObjectId.isValid(normalizedId)) {
      return res.status(400).json({ message: 'Invalid volunteer hours id format' });
    }
    // If the client included volunteer/event/shift date/clock in fields but left them empty,
    // return a clear error that lists exactly which fields are empty instead of performing an update.
    const isEmpty = v => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
    const checkKeys = ['Volunteer__c', 'Event__c', 'Shift_Date__c', 'Clock_In_Time__c'];
    const fieldNameMap = {
      Volunteer__c: 'Volunteer id',
      Event__c: 'Event id',
      Shift_Date__c: 'Shift date',
      Clock_In_Time__c: 'Clock in time'
    };
    const emptyProvided = checkKeys.filter(k => k in req.body && isEmpty(req.body[k])).map(k => fieldNameMap[k] || k);
    if (emptyProvided.length > 0) {
      let message;
      if (emptyProvided.length === 1) message = `${emptyProvided[0]} is empty`;
      else if (emptyProvided.length === 2) message = `${emptyProvided[0]} and ${emptyProvided[1]} are empty`;
      else {
        const copy = [...emptyProvided];
        const last = copy.pop();
        message = `${copy.join(', ')}, and ${last} are empty`;
      }
      return res.status(400).json({ message });
    }

    // If the client provided date/time fields, validate their formats and return an explicit 400.
    if ('Shift_Date__c' in req.body && !isValidDateOnly(String(req.body.Shift_Date__c))) {
      return res.status(400).json({ message: `Shift date is invalid: ${req.body.Shift_Date__c} (expected format: YYYY-MM-DD)` });
    }
    if ('Clock_In_Time__c' in req.body && !isValidDateTime(String(req.body.Clock_In_Time__c))) {
      return res.status(400).json({ message: `Clock in time is invalid: ${req.body.Clock_In_Time__c} (expected ISO 8601 datetime, e.g. 2024-03-01T14:30:00Z)` });
    }
    if ('Clock_Out_Time__c' in req.body && req.body.Clock_Out_Time__c && !isValidDateTime(String(req.body.Clock_Out_Time__c))) {
      return res.status(400).json({ message: `Clock out time is invalid: ${req.body.Clock_Out_Time__c} (expected ISO 8601 datetime, e.g. 2024-03-01T14:30:00Z)` });
    }

    const allowed = ['Shift_Date__c', 'Clock_In_Time__c', 'Clock_Out_Time__c', 'Notes__c'];
    const updates = {};
    allowed.forEach(k => {
      if (k in req.body) updates[k] = req.body[k];
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No updatable fields provided.' });
    }

    const shift = await VolunteerHours.findById(normalizedId);
    if (!shift) return res.status(404).json({ message: `VolunteerHours ${normalizedId} not found` });

    // If the client supplied a Volunteer__c or Event__c in the body, validate existence and
    // return a 404 "<Resource> <id> not found" for better UX instead of a 400 format error.
    if ('Volunteer__c' in req.body) {
      const volId = String(req.body.Volunteer__c).trim();
      if (!mongoose.Types.ObjectId.isValid(volId)) {
        return res.status(404).json({ message: `Volunteer ${volId} not found` });
      }
      const Volunteer = require('../models/Volunteer');
      const vol = await Volunteer.findById(volId).catch(() => null);
      if (!vol) return res.status(404).json({ message: `Volunteer ${volId} not found` });
      // We don't allow changing the volunteer on an existing shift here, but validation is helpful.
    }
    if ('Event__c' in req.body) {
      const eventId = String(req.body.Event__c).trim();
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(404).json({ message: `Event ${eventId} not found` });
      }
      const Event = require('../models/Event');
      const ev = await Event.findById(eventId).catch(() => null);
      if (!ev) return res.status(404).json({ message: `Event ${eventId} not found` });
      // As above, we validate but do not apply event changes in this endpoint.
    }

    if (updates.Shift_Date__c) shift.Shift_Date__c = new Date(updates.Shift_Date__c);
    if (updates.Clock_In_Time__c) shift.Clock_In_Time__c = new Date(updates.Clock_In_Time__c);
    if (updates.Clock_Out_Time__c) shift.Clock_Out_Time__c = new Date(updates.Clock_Out_Time__c);
    if ('Notes__c' in updates) shift.Notes__c = updates.Notes__c;

    const total = computeTotalHours(shift.Clock_In_Time__c, shift.Clock_Out_Time__c);
    if (typeof total !== 'undefined') shift.Total_Hours__c = total;
    shift.Submitted_Date__c = new Date();

    await shift.save();
    await logActivity({ schema: 'VolunteerHours', activity_type: 'update', user_id: req.user?.id || null, activity_response: `VolunteerHours ${shift._id} updated` });
    res.json({ message: `VolunteerHours ${shift._id} updated`, shift });
  } catch (err) {
    console.error('Update shift error:', err);
    await logActivity({ schema: 'VolunteerHours', activity_type: 'update', user_id: req.user?.id || null, activity_response: err.message });
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /volunteerhours/event/:eventId
const getShiftsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!eventId) return res.status(400).json({ message: 'Event id is required' });
    if (!mongoose.Types.ObjectId.isValid(String(eventId))) {
      // prefer a 404 Not Found message for UX consistency
      return res.status(404).json({ message: `Event ${eventId} not found` });
    }
    // verify event exists
    const Event = require('../models/Event');
    const ev = await Event.findById(eventId);
    if (!ev) return res.status(404).json({ message: `Event ${eventId} not found` });

    const shifts = await VolunteerHours.find({ Event__c: eventId });
    res.json(shifts);
  } catch (err) {
    console.error('Get shifts by event error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /volunteerhours/volunteer/:volunteerId
const getShiftsByVolunteer = async (req, res) => {
  try {
    const { volunteerId } = req.params;
    if (!volunteerId) return res.status(400).json({ message: 'Volunteer id is required' });
    if (!mongoose.Types.ObjectId.isValid(String(volunteerId))) {
      return res.status(404).json({ message: `Volunteer ${volunteerId} not found` });
    }
    // verify volunteer exists
    const Volunteer = require('../models/Volunteer');
    const vol = await Volunteer.findById(volunteerId);
    if (!vol) return res.status(404).json({ message: `Volunteer ${volunteerId} not found` });

    const shifts = await VolunteerHours.find({ Volunteer__c: volunteerId });
    res.json(shifts);
  } catch (err) {
    console.error('Get shifts by volunteer error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /volunteerhours/event/:eventId/volunteer/:volunteerId
const getShiftsByEventVolunteer = async (req, res) => {
  try {
    const { eventId, volunteerId } = req.params;
    if (!eventId || !volunteerId) return res.status(400).json({ message: 'event id and volunteer id are required' });
    if (!mongoose.Types.ObjectId.isValid(String(eventId))) return res.status(404).json({ message: `Event ${eventId} not found` });
    if (!mongoose.Types.ObjectId.isValid(String(volunteerId))) return res.status(404).json({ message: `Volunteer ${volunteerId} not found` });

    // verify both exist
    const Event = require('../models/Event');
    const Volunteer = require('../models/Volunteer');
    const [ev, vol] = await Promise.all([Event.findById(eventId), Volunteer.findById(volunteerId)]);
    if (!ev) return res.status(404).json({ message: `Event ${eventId} not found` });
    if (!vol) return res.status(404).json({ message: `Volunteer ${volunteerId} not found` });

    const shifts = await VolunteerHours.find({ Event__c: eventId, Volunteer__c: volunteerId });
    res.json(shifts);
  } catch (err) {
    console.error('Get shifts by event+volunteer error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /volunteerhours - get all shifts
const getAllShifts = async (req, res) => {
  try {
    const shifts = await VolunteerHours.find({});
    res.json(shifts);
  } catch (err) {
    console.error('Get all shifts error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  createShift,
  updateShift,
  getAllShifts,
  getShiftsByEvent,
  getShiftsByVolunteer,
  getShiftsByEventVolunteer
};

// DELETE /volunteerhours/:id - delete a shift
const deleteShift = async (req, res) => {
  try {
    const { id } = req.params;
    const normalizedId = (id === undefined || id === null) ? '' : String(id).trim();
    if (normalizedId === '' || normalizedId === ':id' || ['undefined', 'null'].includes(normalizedId.toLowerCase())) {
      return res.status(400).json({ message: 'volunteer hours id should not be empty' });
    }
    if (!mongoose.Types.ObjectId.isValid(normalizedId)) {
      return res.status(400).json({ message: 'Invalid volunteer hours id format' });
    }

    const shift = await VolunteerHours.findByIdAndDelete(normalizedId);
    if (!shift) return res.status(404).json({ message: `VolunteerHours ${normalizedId} not found` });
    await logActivity({ schema: 'VolunteerHours', activity_type: 'delete', user_id: req.user?.id || null, activity_response: `VolunteerHours ${normalizedId} deleted` });
    res.json({ message: `VolunteerHours ${normalizedId} deleted` });
  } catch (err) {
    console.error('Delete shift error:', err);
    await logActivity({ schema: 'VolunteerHours', activity_type: 'delete', user_id: req.user?.id || null, activity_response: err.message });
    res.status(500).json({ message: 'Server error.' });
  }
};

// attach export
module.exports.deleteShift = deleteShift;
