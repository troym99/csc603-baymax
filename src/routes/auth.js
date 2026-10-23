require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { query } = require('../db');

const SECRET = process.env.JWT_SECRET;
if (!SECRET) throw new Error('JWT_SECRET is not set (check your .env)');

const COOKIE = 'token';
const cookieOpts = {
  httpOnly: true,
  sameSite: 'lax',
  // set COOKIE_SECURE=true once the site is served over HTTPS
  secure: process.env.COOKIE_SECURE === 'true',
};

// Used so a login for an unknown user takes as long as a real one
const DUMMY_HASH = bcrypt.hashSync('dummy-password', 12);

const router = express.Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true, legacyHeaders: false });

function clean(body) {
  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  return { username, password };
}

function validate({ username, password }) {
  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    return 'Username must be 3-30 characters: letters, numbers, underscore';
  }
  if (password.length < 8 || password.length > 72) {
    return 'Password must be 8-72 characters';
  }
  return null;
}

function startSession(res, user) {
  const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: '7d' });
  res.cookie(COOKIE, token, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

router.post('/signup', limiter, async (req, res, next) => {
  try {
    const creds = clean(req.body);
    const problem = validate(creds);
    if (problem) return res.status(400).json({ error: problem });

    const hash = await bcrypt.hash(creds.password, 12);
    const { rows } = await query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [creds.username, hash]
    );
    startSession(res, rows[0]);
    res.status(201).json({ user: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Username already taken' });
    next(err);
  }
});

router.post('/login', limiter, async (req, res, next) => {
  try {
    const { username, password } = clean(req.body);
    const { rows } = await query(
      'SELECT id, username, password_hash FROM users WHERE username = $1',
      [username]
    );
    const user = rows[0];
    const ok = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
    if (!user || !ok) return res.status(401).json({ error: 'Invalid username or password' });

    startSession(res, user);
    res.json({ user: { id: user.id, username: user.username } });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE, cookieOpts);
  res.status(204).end();
});

router.get('/me', async (req, res, next) => {
  try {
    const token = req.cookies[COOKIE];
    if (!token) return res.status(401).json({ error: 'Not logged in' });
    let payload;
    try {
      payload = jwt.verify(token, SECRET);
    } catch {
      return res.status(401).json({ error: 'Not logged in' });
    }
    const { rows } = await query('SELECT id, username FROM users WHERE id = $1', [payload.id]);
    if (rows.length === 0) return res.status(401).json({ error: 'Not logged in' });
    res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
