const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs'); // bcryptjs = pure JS, no native bindings, no vulnerabilities
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const auth    = require('../middleware/authMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const signToken  = (id) =>
  new Promise((resolve, reject) =>
    jwt.sign({ user: { id } }, JWT_SECRET, { expiresIn: '7d' }, (err, token) =>
      err ? reject(err) : resolve(token)
    )
  );

/* ── Register ─────────────────────────────────────────────── */
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ msg: 'Username, email and password are required' });
  if (username.trim().length < 2)
    return res.status(400).json({ msg: 'Username must be at least 2 characters' });
  if (password.length < 6)
    return res.status(400).json({ msg: 'Password must be at least 6 characters' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ msg: 'Please enter a valid email address' });

  try {
    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(400).json({ msg: 'An account with this email already exists' });
    if (await User.findOne({ username: username.trim() }))
      return res.status(400).json({ msg: 'This username is already taken' });

    const hashed = await bcrypt.hash(password, 10);
    const user   = await User.create({ username: username.trim(), email: email.toLowerCase(), password: hashed });
    const token  = await signToken(user.id);

    res.status(201).json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    console.error('Register error:', err.message);
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(400).json({ msg: `This ${field} is already in use` });
    }
    res.status(500).json({ msg: 'Server error — please try again' });
  }
});

/* ── Login ────────────────────────────────────────────────── */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ msg: 'Email and password are required' });

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ msg: 'Invalid email or password' });

    const token = await signToken(user.id);
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ msg: 'Server error — please try again' });
  }
});

/* ── Get current user ─────────────────────────────────────── */
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json({ id: user.id, username: user.username, email: user.email });
  } catch (err) {
    console.error('Auth/me error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

/* ── Reset password (simple demo — no OTP) ───────────────── */
router.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword)
    return res.status(400).json({ msg: 'Email and new password are required' });
  if (newPassword.length < 6)
    return res.status(400).json({ msg: 'Password must be at least 6 characters' });

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ msg: 'No account found with that email' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ msg: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset-password error:', err.message);
    res.status(500).json({ msg: 'Server error — please try again' });
  }
});

module.exports = router;
