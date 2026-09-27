// middleware/auth.js
require('dotenv').config();
const jwt = require('jsonwebtoken');

// ✅ This supports both session (for website) and token (for APIs)
function verifyUser(req, res, next) {
  // 1. ✅ First: check if logged in using session
  if (req.session?.user) {
    req.user = req.session.user; // attach to request for later use
    return next();
  }

  // 2. 🔁 Else: check if token is sent via Authorization header
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) {
    // If request is from browser (accepts HTML), redirect to login
    if (req.accepts('html')) {
      return res.redirect('/studlogin');
    }
    return res.status(401).json({ message: 'Access denied: no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('JWT error:', err);
    return res.status(400).json({ message: 'Invalid token' });
  }
}

// ✅ Optional alias if you want cleaner naming
const isUserAuthenticated = verifyUser;

module.exports = {
  verifyUser,
  isUserAuthenticated
};
