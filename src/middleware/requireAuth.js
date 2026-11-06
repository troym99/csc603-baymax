const jwt = require('jsonwebtoken');

// Blocks the request unless the login cookie (set by /api/login) is valid.
// Sets req.user = { id } for the route that follows.
function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Not logged in' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id };
    next();
  } catch {
    res.status(401).json({ error: 'Not logged in' });
  }
}

module.exports = requireAuth;