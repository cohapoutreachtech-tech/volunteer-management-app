const History = require('../models/History');
const Volunteer = require('../models/Volunteer');

module.exports = async (req, res, next) => {
  try {
    const tokenUserId = req.user && req.user.id;
    if (!tokenUserId) {
      return res.status(401).json({ message: 'Unauthorized: No user found in token.' });
    }
    // Find the most recent login for this user
    const lastLogin = await History.findOne({
      schema: 'Auth',
      activity_type: 'login',
      user_id: tokenUserId
    }).sort({ activity_timestamp: -1 });

    if (!lastLogin) {
      return res.status(401).json({ message: 'Unauthorized: No login history found.' });
    }
    // Check if user is admin
    const volunteer = await Volunteer.findById(tokenUserId);
    if (!volunteer || volunteer.Volunteer_Type__c !== 'Administrator') {
      return res.status(403).json({ message: 'Forbidden: Admin access required.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};
