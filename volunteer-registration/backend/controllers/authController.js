const Volunteer = require('../models/Volunteer');
const History = require('../models/History');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Function to log activity
const logActivity = async (activityData) => {
  try {
    const activity = new History(activityData);
    await activity.save();
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
    if (!Email__c || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const volunteer = await Volunteer.findOne({ Email__c });
    if (!volunteer) {
      await logActivity({
        schema: 'Auth',
        activity_type: 'login',
        user_id: null,
        activity_response: 'Invalid credentials'
      });
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, volunteer.Pass_Hash);
    if (!isMatch) {
      await logActivity({
        schema: 'Auth',
        activity_type: 'login',
        user_id: volunteer._id,
        activity_response: 'Invalid credentials'
      });
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const payload = {
      id: volunteer._id,
      Email__c: volunteer.Email__c,
      First_Name__c: volunteer.First_Name__c,
      Last_Name__c: volunteer.Last_Name__c,
      Status__c: volunteer.Status__c
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });

    await logActivity({
      schema: 'Auth',
      activity_type: 'login',
      user_id: volunteer._id,
      activity_response: `Login successful | user_id: ${volunteer._id}`
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