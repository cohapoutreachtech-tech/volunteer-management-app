const express = require('express');
const router = express.Router();
const volunteerController = require('../controllers/volunteerController');
const authMiddleware = require('../middleware/auth'); // if you use auth

// Create volunteer
router.post('/', volunteerController.createVolunteer);

// Get all volunteers
router.get('/', authMiddleware, volunteerController.getAllVolunteers);

// Get volunteer by ID
router.get('/:id', authMiddleware, volunteerController.getVolunteerById);

// Get volunteer by email
router.get('/email/:email', authMiddleware, volunteerController.getVolunteerByEmail);

// Update volunteer
router.put('/:id', authMiddleware, volunteerController.updateVolunteer);

// Delete volunteer
router.delete('/:id', authMiddleware, volunteerController.deleteVolunteer);

module.exports = router;
