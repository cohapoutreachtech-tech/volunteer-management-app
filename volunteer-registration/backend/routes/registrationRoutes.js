const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');

// Example: POST /registrations
router.post('/', registrationController.registerVolunteer);

// Example: GET /registrations/:volunteerId/:eventId
router.get('/:volunteerId/:eventId', registrationController.getRegistration);

module.exports = router;