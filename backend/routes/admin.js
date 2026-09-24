const express = require('express');
const router  = express.Router();
const { db }  = require('../db/database');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.use(authenticate, authorize('admin', 'manager'));

// GET /api/admin/leaves
router.get('/leaves', (req, res) => {
  const { status } = req.query;
  let leaves = db.get('leave_requests').value();
  if (status) leaves = leaves.filter(l => l.status === status);

  leaves = leaves
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(l => {
      const emp = db.get('users').find({ id: l.user_id }).value() || {};
      const rev = l.reviewed_by ? db.get('users').find({ id: l.reviewed_by }).value() : null;
      return {
        ...l,
        employee_name:    emp.name,
        employee_email:   emp.email,
        department:       emp.department,
        employee_id:      emp.employee_id,
        reviewed_by_name: rev?.name || null
      };
    });
  res.json(leaves);
});

// PUT /api/admin/leaves/:id
router.put('/leaves/:id', (req, res) => {
  const id    = parseInt(req.params.id);
  const { status, admin_comments } = req.body;

  if (!['approved','rejected'].includes(status))
    return res.status(400).json({ message: 'Status must be approved or rejected.' });

  const leave = db.get('leave_requests').find({ id }).value();
  if (!leave)            return res.status(404).json({ message: 'Leave not found.' });
  if (leave.status !== 'pending') return res.status(400).json({ message: `Cannot review a ${leave.status} request.` });

  if (status === 'approved' && leave.leave_type !== 'unpaid') {
    const field   = `${leave.leave_type}_leaves`;
    const balance = db.get('leave_balances').find({ user_id: leave.user_id }).value();
    if (!balance || balance[field] < leave.days)
      return res.status(400).json({ message: 'Insufficient leave balance.' });
    db.get('leave_balances').find({ user_id: leave.user_id })
      .assign({ [field]: balance[field] - leave.days }).write();
  }

  db.get('leave_requests').find({ id }).assign({
    status,
    reviewed_by:    req.user.id,
    reviewed_at:    new Date().toISOString(),
    admin_comments: admin_comments?.trim() || null
  }).write();

  res.json({ message: `Leave ${status}.` });
});

// GET /api/admin/employees
router.get('/employees', (req, res) => {
  const employees = db.get('users').value().map(u => {
    const { password: _, ...safe } = u;
    const balance = db.get('leave_balances').find({ user_id: u.id }).value() || {};
    return { ...safe, ...balance };
  }).sort((a, b) => a.name.localeCompare(b.name));
  res.json(employees);
});

// GET /api/admin/stats
router.get('/stats', (req, res) => {
  const users    = db.get('users').value();
  const requests = db.get('leave_requests').value();
  res.json({
    totalEmployees: users.filter(u => u.role === 'employee').length,
    pendingLeaves:  requests.filter(l => l.status === 'pending').length,
    approvedLeaves: requests.filter(l => l.status === 'approved').length,
    rejectedLeaves: requests.filter(l => l.status === 'rejected').length,
    leavesByType:   ['annual','sick','casual','maternity','paternity','unpaid'].map(t => ({
      leave_type: t, count: requests.filter(l => l.leave_type === t).length
    })),
    recentLeaves: requests
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10)
      .map(l => {
        const u = db.get('users').find({ id: l.user_id }).value() || {};
        return { ...l, employee_name: u.name, department: u.department };
      })
  });
});

// PUT /api/admin/employees/:id/role
router.put('/employees/:id/role', authorize('admin'), (req, res) => {
  const id   = parseInt(req.params.id);
  const { role } = req.body;
  if (!['employee','manager','admin'].includes(role))
    return res.status(400).json({ message: 'Invalid role.' });
  if (id === req.user.id)
    return res.status(400).json({ message: 'Cannot change your own role.' });

  const user = db.get('users').find({ id }).value();
  if (!user) return res.status(404).json({ message: 'Employee not found.' });
  db.get('users').find({ id }).assign({ role }).write();
  res.json({ message: `Role updated to ${role}.` });
});

module.exports = router;
