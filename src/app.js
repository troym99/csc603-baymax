const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const { query } = require('./db');
const authRouter = require('./routes/auth');

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/health', async (req, res, next) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', db: 'up' });
  } catch (err) {
    next(err);
  }
});

app.use('/api', authRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: 'Internal server error' });
});

module.exports = app;
