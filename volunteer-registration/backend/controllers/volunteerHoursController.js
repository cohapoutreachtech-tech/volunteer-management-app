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

    if (!Volunteer__c || !Shift_Date__c || !Clock_In_Time__c) {
      return res.status(400).json({ message: 'Volunteer__c, Shift_Date__c and Clock_In_Time__c are required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(String(Volunteer__c))) {
      return res.status(400).json({ message: 'Invalid Volunteer__c format' });
    }
    if (Event__c && !mongoose.Types.ObjectId.isValid(String(Event__c))) {
      return res.status(400).json({ message: 'Invalid Event__c format' });
    }

    const count = await VolunteerHours.countDocuments();
    const name = `HRS-${(count + 1).toString().padStart(4, '0')}`;

    const inDate = new Date(Clock_In_Time__c);
    const outDate = Clock_Out_Time__c ? new Date(Clock_Out_Time__c) : undefined;

    const total = computeTotalHours(inDate, outDate);

    const shift = new VolunteerHours({
      name,
      Volunteer__c,
      Event__c: Event__c || undefined,
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
    if (!eventId || !mongoose.Types.ObjectId.isValid(String(eventId))) {
      return res.status(400).json({ message: 'Invalid event id' });
    }
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
    if (!volunteerId || !mongoose.Types.ObjectId.isValid(String(volunteerId))) {
      return res.status(400).json({ message: 'Invalid volunteer id' });
    }
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
    if (!eventId || !volunteerId || !mongoose.Types.ObjectId.isValid(String(eventId)) || !mongoose.Types.ObjectId.isValid(String(volunteerId))) {
      return res.status(400).json({ message: 'Invalid event id or volunteer id' });
    }
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
