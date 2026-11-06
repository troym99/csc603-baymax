const express = require('express');
const rateLimit = require('express-rate-limit');
const requireAuth = require('../middleware/requireAuth');
const { generateAIResponse } = require('../services/inference');

const router = express.Router();

// Each model call costs money, so: logged-in users only, and a cap per user.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user.id),
  message: { error: 'Too many messages, please wait a few minutes' },
});

router.post('/generate', requireAuth, limiter, async (req, res) => {
  const message = req.body?.message;

  if (typeof message != 'string' ||
      message.trim().length === 0 ||
      message.length > 2000
  ) {
    return res.status(400).json({
      error: 'Invalid message'
    });
  }

  try {
    const result = await generateAIResponse(message);

    res.json(result);
  } catch (error) {
    console.error('AI inference error: ', error);

    res.status(502).json({
      error: 'Baymax is unavailable'
    });
  }
});

module.exports = router;