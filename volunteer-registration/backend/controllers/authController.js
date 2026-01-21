const Volunteer = require('../models/Volunteer');
const History = require('../models/History');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Function to log activity (Salesforce-compatible)
const logActivity = async (activityData) => {
  try {
    // Convert MongoDB-style fields to Salesforce fields
    const sfData = {
      Schema__c: activityData.schema || activityData.Schema__c,
      Activity_Type__c: activityData.activity_type || activityData.Activity_Type__c,
      User__c: activityData.user_id || activityData.User__c,
      Activity_Response__c: activityData.activity_response || activityData.Activity_Response__c,
      Activity_Timestamp__c: new Date().toISOString()
    };
    await History.create(sfData);
  } catch (err) {
    console.error('Error logging activity:', err);
  }
};

// Middleware or helper to check token expiration
function checkTokenExpiration(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { expired: false, decoded };
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return { expired: true, decoded: null };
    }
    throw err;
  }
}

// Example protected endpoint usage (add to any controller that needs to check token expiration)
exports.protectedEndpoint = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    const { expired, decoded } = checkTokenExpiration(token);
    if (expired) {
      return res.status(401).json({ message: 'Token has expired.' });
    }
    // ...existing logic for the endpoint...
    res.json({ message: 'Token is valid.', user: decoded });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.login = async (req, res) => {
  try {
    const Email__c = req.body.Email__c || req.body.email;
    const password = req.body.password;
    
    if (!Email__c || Email__c.trim() === '') {
      return res.status(400).json({ message: 'Email is required and cannot be empty.' });
    }
    
    if (!password || password.trim() === '') {
      return res.status(400).json({ message: 'Password is required and cannot be empty.' });
    }

    const volunteer = await Volunteer.findOne({ Email__c });
    if (!volunteer) {
      return res.status(401).json({ message: `Invalid email ${Email__c}` });
    }

    // Check if Pass_Hash__c exists and is not empty
    if (!volunteer.Pass_Hash__c) {
      console.error('Pass_Hash__c is missing for volunteer:', volunteer.Id);
      return res.status(500).json({ message: 'Password hash not found for this user.' });
    }

    const isMatch = await bcrypt.compare(password, volunteer.Pass_Hash__c);
    if (!isMatch) {
      await logActivity({
        schema: 'Auth',
        activity_type: 'login',
        user_id: volunteer.Id,
        activity_response: 'Invalid credentials'
      });
      return res.status(401).json({ message: 'Invalid password.' });
    }

    const payload = {
      id: volunteer.Id,
      Email__c: volunteer.Email__c,
      First_Name__c: volunteer.First_Name__c,
      Last_Name__c: volunteer.Last_Name__c,
      Status__c: volunteer.Status__c
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });

    await logActivity({
      schema: 'Auth',
      activity_type: 'login',
      user_id: volunteer.Id,
      activity_response: `Login successful | user_id: ${volunteer.Id}`
    });

    res.json({
      token,
      volunteer: payload
    });
  } catch (err) {
    await logActivity({
      schema: 'Auth',
      activity_type: 'login',
      user_id: null,
      activity_response: err.message
    });
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};