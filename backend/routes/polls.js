const express  = require('express');
const router   = express.Router();
const Poll     = require('../models/Poll');
const Response = require('../models/Response');
const auth     = require('../middleware/authMiddleware');

/* ── Create poll ──────────────────────────────────────────── */
router.post('/', auth, async (req, res) => {
  try {
    const { title, questions, isAnonymous, expiresAt } = req.body;
    if (!title || !title.trim())
      return res.status(400).json({ msg: 'Poll title is required' });
    if (!questions || questions.length === 0)
      return res.status(400).json({ msg: 'A poll must have at least one question' });

    const poll = await Poll.create({ title: title.trim(), creator: req.user.id, questions, isAnonymous, expiresAt });
    res.status(201).json(poll);
  } catch (err) {
    console.error('Create poll error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

/* ── My polls ─────────────────────────────────────────────── */
router.get('/my-polls', auth, async (req, res) => {
  try {
    const polls = await Poll.find({ creator: req.user.id }).sort({ createdAt: -1 });
    res.json(polls);
  } catch (err) {
    console.error('My-polls error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

/* ── Get single poll ──────────────────────────────────────── */
router.get('/:id', async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ msg: 'Poll not found' });
    res.json(poll);
  } catch (err) {
    console.error('Get poll error:', err.message);
    if (err.name === 'CastError') return res.status(404).json({ msg: 'Poll not found' });
    res.status(500).json({ msg: 'Server error' });
  }
});

/* ── Publish results ──────────────────────────────────────── */
router.put('/:id/publish', auth, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ msg: 'Poll not found' });
    if (poll.creator.toString() !== req.user.id)
      return res.status(403).json({ msg: 'Not authorized' });

    poll.isPublished = true;
    await poll.save();
    res.json(poll);
  } catch (err) {
    console.error('Publish error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

/* ── Edit poll ────────────────────────────────────────────── */
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, questions, isAnonymous, expiresAt } = req.body;
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ msg: 'Poll not found' });
    if (poll.creator.toString() !== req.user.id)
      return res.status(403).json({ msg: 'Not authorized' });
    if (!questions || questions.length === 0)
      return res.status(400).json({ msg: 'A poll must have at least one question' });

    const updated = await Poll.findByIdAndUpdate(
      req.params.id,
      { title: title || poll.title, questions, isAnonymous: isAnonymous ?? poll.isAnonymous, expiresAt: expiresAt || poll.expiresAt },
      { new: true, runValidators: true }
    );
    res.json(updated);
  } catch (err) {
    console.error('Edit poll error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

/* ── Delete poll ──────────────────────────────────────────── */
router.delete('/:id', auth, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ msg: 'Poll not found' });
    if (poll.creator.toString() !== req.user.id)
      return res.status(403).json({ msg: 'Not authorized' });

    await Poll.findByIdAndDelete(req.params.id);
    await Response.deleteMany({ pollId: req.params.id });
    res.json({ msg: 'Poll deleted' });
  } catch (err) {
    console.error('Delete poll error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
