const low    = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const bcrypt = require('bcryptjs');
const path   = require('path');
const fs     = require('fs');
const { v4: uuidv4 } = require('uuid');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const adapter = new FileSync(path.join(dataDir, 'db.json'));
const db      = low(adapter);

// ── Default schema ────────────────────────────────────────────────────────────
db.defaults({ users: [], leave_balances: [], leave_requests: [] }).write();

// ── Auto-increment helper ─────────────────────────────────────────────────────
function nextId(collection) {
  const items = db.get(collection).value();
  return items.length === 0 ? 1 : Math.max(...items.map(i => i.id)) + 1;
}

function initDatabase() {
  const adminExists = db.get('users').find({ role: 'admin' }).value();
  if (!adminExists) {
    const id = nextId('users');
    db.get('users').push({
      id,
      name:        'Admin User',
      email:       'admin@company.com',
      password:    bcrypt.hashSync('admin123', 10),
      role:        'admin',
      department:  'HR',
      employee_id: 'EMP001',
      created_at:  new Date().toISOString()
    }).write();

    db.get('leave_balances').push({
      id: nextId('leave_balances'),
      user_id:          id,
      annual_leaves:    12,
      sick_leaves:      10,
      casual_leaves:    6,
      maternity_leaves: 90,
      paternity_leaves: 15
    }).write();

    console.log('✅ Default admin seeded → admin@company.com / admin123');
  }
  console.log('✅ Database ready (lowdb / db.json)');
}

module.exports = { db, initDatabase, nextId };
