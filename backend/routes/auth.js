const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { db, nextId } = require('../db/database');
const { authenticate } = require('../middleware/authMiddleware');

const SECRET  = process.env.JWT_SECRET  || 'your_jwt_secret_key';
const EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, password, department, employee_id } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: 'Name, email and password are required.' });
  if (password.length < 6)
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });

  const existing = db.get('users').find({ email: email.toLowerCase().trim() }).value();
  if (existing) return res.status(409).json({ message: 'Email already registered.' });

  const id = nextId('users');
  const user = {
    id,
    name:        name.trim(),
    email:       email.toLowerCase().trim(),
    password:    bcrypt.hashSync(password, 10),
    role:        'employee',
    department:  department || 'General',
    employee_id: employee_id?.trim() || null,
    created_at:  new Date().toISOString()
  };
  db.get('users').push(user).write();
  db.get('leave_balances').push({
    id: nextId('leave_balances'),
    user_id: id, annual_leaves: 12, sick_leaves: 10,
    casual_leaves: 6, maternity_leaves: 90, paternity_leaves: 15
  }).write();

  const token = jwt.sign({ id, email: user.email, role: 'employee', name }, SECRET, { expiresIn: EXPIRES });
  res.status(201).json({ message: 'Account created.', token, user: { id, name, email: user.email, role: 'employee', department: user.department } });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required.' });

  const user = db.get('users').find({ email: email.toLowerCase().trim() }).value();
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ message: 'Invalid email or password.' });

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, SECRET, { expiresIn: EXPIRES });
  res.json({
    message: 'Login successful.',
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department, employee_id: user.employee_id }
  });
});

// GET /api/auth/profile
router.get('/profile', authenticate, (req, res) => {
  const user    = db.get('users').find({ id: req.user.id }).value();
  const balance = db.get('leave_balances').find({ user_id: req.user.id }).value();
  if (!user) return res.status(404).json({ message: 'User not found.' });
  const { password: _, ...safeUser } = user;
  res.json({ user: safeUser, balance });
});

module.exports = router;
