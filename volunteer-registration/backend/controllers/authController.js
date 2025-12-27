const Volunteer = require('../models/Volunteer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const Email__c = req.body.Email__c || req.body.email;
    const password = req.body.password;
    if (!Email__c || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Enhanced debug: print all emails and the search value
    const allVolunteers = await Volunteer.find({}, { Email__c: 1, _id: 0 });
    console.log('DEBUG: All emails in DB:', allVolunteers.map(v => v.Email__c));
    console.log('DEBUG: Searching for email:', Email__c, '| Length:', Email__c.length, '| Bytes:', Buffer.from(Email__c).toString('hex'));

    const volunteer = await Volunteer.findOne({ Email__c });
    if (!volunteer) {
      console.log('DEBUG: Volunteer not found for email:', Email__c);
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, volunteer.Pass_Hash);

    // Debug: log the result of bcrypt.compare
    console.log('DEBUG bcrypt.compare result:', isMatch);

    if (!isMatch) {
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

    res.json({
      token,
      volunteer: payload
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};