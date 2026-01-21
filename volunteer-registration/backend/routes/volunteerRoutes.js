const express = require('express');
const router = express.Router();
const volunteerController = require('../controllers/volunteerController');

// @route   POST /volunteers
// @desc    Register a new volunteer
// @access  Public
router.post('/', volunteerController.createVolunteer);

// @route   GET /volunteers
// @desc    Get all volunteers
// @access  Public
router.get('/', volunteerController.getAllVolunteers);

// @route   GET /volunteers/:id
// @desc    Get volunteer by ID
// @access  Public
router.get('/:id', volunteerController.getVolunteerById);

// @route   GET /volunteers/email/:email
// @desc    Get volunteer by email
// @access  Public
router.get('/email/:email', volunteerController.getVolunteerByEmail);

// @route   PUT /volunteers/:id
// @desc    Update volunteer by ID
// @access  Public
router.put('/:id', volunteerController.updateVolunteer);

// @route   DELETE /volunteers/:id
// @desc    Delete volunteer by ID
// @access  Public
router.delete('/:id', volunteerController.deleteVolunteer);

module.exports = router;