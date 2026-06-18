const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const Response = require('../models/Response');
const Poll     = require('../models/Poll');
const auth     = require('../middleware/authMiddleware');

/* ── Submit response ──────────────────────────────────────── */
router.post('/:pollId', async (req, res) => {
  try {
    const { answers } = req.body;
    const { pollId }  = req.params;

    // Optionally decode token for logged-in users
    let respondentId = null;
    const authHeader = req.header('Authorization');
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        respondentId  = decoded.user.id;
      } catch (_) { /* anonymous */ }
    }

    const poll = await Poll.findById(pollId);
    if (!poll) return res.status(404).json({ msg: 'Poll not found' });
    if (new Date() > new Date(poll.expiresAt))
      return res.status(410).json({ msg: 'The deadline is over. You are too late to vote.' });

    // Validate mandatory questions
    for (let i = 0; i < poll.questions.length; i++) {
      if (poll.questions[i].isMandatory) {
        const ans = answers?.find(a => a.questionIndex === i);
        if (!ans?.selectedOption)
          return res.status(400).json({ msg: `Question ${i + 1} is mandatory` });
      }
    }

    // Auth-required poll
    if (!poll.isAnonymous && !respondentId)
      return res.status(401).json({ msg: 'You must be logged in to vote on this poll' });

    // Prevent duplicate votes for logged-in users
    if (respondentId) {
      const existing = await Response.findOne({ pollId, respondentId });
      if (existing) return res.status(400).json({ msg: 'You have already voted on this poll' });
    }

    // Prevent duplicate anonymous votes via fingerprint (IP + user-agent hash)
    // Simple approach: store a session key in the response if anonymous
    // (Full IP-based dedup would need req.ip — kept simple here)

    const saved = await Response.create({ pollId, respondentId, answers });

    // Emit real-time update
    const io = req.app.get('io');
    if (io) io.to(pollId).emit('new_response', saved);

    res.status(201).json(saved);
  } catch (err) {
    console.error('Submit response error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

/* ── Get responses (creator or published) ────────────────── */
router.get('/:pollId', async (req, res) => {
  try {
    // Optionally decode token
    let requesterId = null;
    const authHeader = req.header('Authorization');
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        requesterId   = decoded.user.id;
      } catch (_) {}
    }

    const poll = await Poll.findById(req.params.pollId);
    if (!poll) return res.status(404).json({ msg: 'Poll not found' });

    const isCreator = requesterId && poll.creator.toString() === requesterId;
    if (!isCreator && !poll.isPublished)
      return res.status(403).json({ msg: 'Results not published yet' });

    const responses = await Response.find({ pollId: req.params.pollId });
    res.json(responses);
  } catch (err) {
    console.error('Get responses error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
