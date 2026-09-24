const express = require('express');
const router  = express.Router();
const { db, nextId } = require('../db/database');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

function countWorkingDays(s, e) {
  const start = new Date(s), end = new Date(e);
  if (start > end) return 0;
  let count = 0, cur = new Date(start);
  while (cur <= end) {
    const d = cur.getDay();
    if (d !== 0 && d !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

// POST /api/leaves/apply
router.post('/apply', (req, res) => {
  const { leave_type, start_date, end_date, reason } = req.body;
  const user_id = req.user.id;

  if (!leave_type || !start_date || !end_date || !reason?.trim())
    return res.status(400).json({ message: 'All fields are required.' });

  const days = countWorkingDays(start_date, end_date);
  if (days === 0) return res.status(400).json({ message: 'No working days in selected range.' });

  if (leave_type !== 'unpaid') {
    const balance = db.get('leave_balances').find({ user_id }).value();
    const field   = `${leave_type}_leaves`;
    if (!balance || balance[field] == null) return res.status(400).json({ message: `Invalid leave type.` });
    if (balance[field] < days)
      return res.status(400).json({ message: `Not enough ${leave_type} leave. Available: ${balance[field]}, requested: ${days}.` });
  }

  // Check overlap
  const overlap = db.get('leave_requests').find(l =>
    l.user_id === user_id &&
    !['rejected','cancelled'].includes(l.status) &&
    !(l.end_date < start_date || l.start_date > end_date)
  ).value();
  if (overlap) return res.status(409).json({ message: 'You already have a leave overlapping these dates.' });

  const id = nextId('leave_requests');
  db.get('leave_requests').push({
    id, user_id, leave_type, start_date, end_date, days,
    reason: reason.trim(), status: 'pending',
    reviewed_by: null, reviewed_at: null, admin_comments: null,
    created_at: new Date().toISOString()
  }).write();

  res.status(201).json({ message: 'Leave submitted successfully.', leave_id: id, days });
});

// GET /api/leaves/my-leaves
router.get('/my-leaves', (req, res) => {
  const leaves = db.get('leave_requests')
    .filter({ user_id: req.user.id })
    .value()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(l => {
      const reviewer = l.reviewed_by
        ? db.get('users').find({ id: l.reviewed_by }).value()
        : null;
      return { ...l, reviewed_by_name: reviewer?.name || null };
    });
  res.json(leaves);
});

// GET /api/leaves/balance
router.get('/balance', (req, res) => {
  const balance = db.get('leave_balances').find({ user_id: req.user.id }).value();
  if (!balance) return res.status(404).json({ message: 'Balance not found.' });
  res.json(balance);
});

// PUT /api/leaves/cancel/:id
router.put('/cancel/:id', (req, res) => {
  const id    = parseInt(req.params.id);
  const leave = db.get('leave_requests').find({ id, user_id: req.user.id }).value();
  if (!leave) return res.status(404).json({ message: 'Leave request not found.' });
  if (leave.status !== 'pending') return res.status(400).json({ message: `Cannot cancel a ${leave.status} request.` });

  db.get('leave_requests').find({ id }).assign({ status: 'cancelled' }).write();
  res.json({ message: 'Leave cancelled.' });
});

module.exports = router;
