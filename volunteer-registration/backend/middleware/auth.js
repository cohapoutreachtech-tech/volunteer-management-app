const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token = authHeader && authHeader.split(' ')[0] === 'Bearer' ? authHeader.split(' ')[1] : null;
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const secret = process.env.JWT_SECRET || 'secret_dev_change_this';
    const payload = jwt.verify(token, secret);
    req.user = payload; // payload contains at least id and username
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};