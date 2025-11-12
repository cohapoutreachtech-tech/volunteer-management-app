const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Volunteer = require('../models/Volunteer');
const axios = require('axios');

// Register
router.post('/register', async (req, res) => {
  try {
    const {
      email, password, first_name, last_name, address_line, state, city, zipcode, phone, organization
    } = req.body;
    if (!email || !password || !first_name || !last_name || !address_line || !state || !city || !zipcode)
      return res.status(400).json({ message: 'Missing required fields' });

    const existing = await Volunteer.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already taken' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Default status is pending_approval
    let status = 'pending_approval';

    // Check background
    let flagged = false;
    try {
      const predatorRadarApiKey = process.env.PREDATORRADAR_API_KEY;
      if (predatorRadarApiKey) {
        const resp = await axios.get(
          'https://api.api.predatorradar.com/v1/search',
          {
            params: {
              firstName: first_name,
              lastName: last_name,
              zipcode: zipcode
            },
            headers: {
              Authorization: `Bearer ${predatorRadarApiKey}`
            }
          }
        );
        if (resp.data && Array.isArray(resp.data.offenders) && resp.data.offenders.length > 0) {
          flagged = true;
        }
      }
    } catch (err) {
      // If background check fails, keep status as pending_approval
      console.error('Background check error:', err.message);
    }
    if (flagged) status = 'pending_approval';

    const volunteer = new Volunteer({
      email,
      password: hash,
      first_name,
      last_name,
      address_line,
      state,
      city,
      zipcode,
      phone,
      organization,
      status,
      type: 'Volunteer'
    });
    await volunteer.save();

    const payload = { id: volunteer._id, email: volunteer.email, type: volunteer.type };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret_dev_change_this', { expiresIn: '7d' });

    const ret = volunteer.toObject();
    delete ret.password;

    res.status(201).json({ user: ret, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'username and password are required' });

    const user = await Volunteer.findOne({ username });
    if (!user) return res.status(400).json({ message: 'invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'invalid credentials' });

    const payload = { id: user._id, username: user.username };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret_dev_change_this', { expiresIn: '7d' });

    const ret = user.toObject();
    delete ret.password;

    res.json({ user: ret, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Background check endpoint (admin only)
router.post('/background-check', async (req, res) => {
  try {
    const { first_name, last_name, zipcode } = req.body;
    if (!first_name || !last_name || !zipcode)
      return res.status(400).json({ message: 'Missing required fields' });

    const predatorRadarApiKey = process.env.PREDATORRADAR_API_KEY;
    if (!predatorRadarApiKey)
      return res.status(500).json({ message: 'PredatorRadar API key not configured' });

    const resp = await axios.get(
      'https://api.api.predatorradar.com/v1/search',
      {
        params: {
          firstName: first_name,
          lastName: last_name,
          zipcode: zipcode
        },
        headers: {
          Authorization: `Bearer ${predatorRadarApiKey}`
        }
      }
    );
    res.json(resp.data);
  } catch (err) {
    console.error('Background check error:', err.message);
    res.status(500).json({ message: 'Background check failed' });
  }
});

module.exports = router;
