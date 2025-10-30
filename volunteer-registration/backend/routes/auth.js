const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Volunteer = require('../models/Volunteer'); // <-- fixed path

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password, firstname, lastname } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'username and password are required' });

    const existing = await Volunteer.findOne({ username });
    if (existing) return res.status(400).json({ message: 'username already taken' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const volunteer = new Volunteer({ ...req.body, password: hash });
    await volunteer.save();

    const payload = { id: volunteer._id, username: volunteer.username };
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

module.exports = router;
