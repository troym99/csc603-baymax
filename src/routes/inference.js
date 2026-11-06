const express = require('express');
const { generateAIResponse } = require('../services/inference');

const router = express.Router();

router.post("/generate", async (req, res) => {
    const message = req.body?.message;

    if (typeof message != "string" ||
        message.trim().length === 0 ||
        message.length > 2000
    ) {
        return res.status(400).json({
            error: "Invalid message"
        });
    }

    try {
        const result = await generateAIResponse(message);

        res.json(result);
    } catch (error) {
        console.error("AI inference error: ", error);

        res.status(502).json({
            error: "Baymax is unavailable"
        });
    }
});

module.exports = router;