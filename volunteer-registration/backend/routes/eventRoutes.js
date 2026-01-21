const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

// @route   GET /events
// @desc    Get all events
// @access  Public
router.get('/', eventController.getAllEvents);

// @route   POST /events
// @desc    Create a new event
// @access  Private (Admin)
router.post('/', eventController.createEvent);

// @route   GET /events/:id
// @desc    Get event by ID
// @access  Public
router.get('/:id', eventController.getEventById);

// @route   GET /events/title/:title
// @desc    Get event by title
// @access  Public
router.get('/title/:title', eventController.getEventByTitle);

// @route   PUT /events/:id
// @desc    Update event by ID
// @access  Private (Admin)
router.put('/:id', eventController.updateEvent);

// @route   DELETE /events/:id
// @desc    Delete event by ID
// @access  Private (Admin)
router.delete('/:id', eventController.deleteEvent);

module.exports = router;