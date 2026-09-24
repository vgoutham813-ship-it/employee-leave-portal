require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Initialise SQLite ─────────────────────────────────────────────────────────
initDatabase();

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',  require('./routes/auth'));
app.use('/api/leaves', require('./routes/leaves'));
app.use('/api/admin',  require('./routes/admin'));

// Health check
app.get('/api/health', (_req, res) =>
  res.json({ status: 'OK', message: 'Employee Leave Portal API is running 🚀' })
);

// 404 catch-all
app.use((_req, res) =>
  res.status(404).json({ message: 'Route not found.' })
);

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error.' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Server running  →  http://localhost:${PORT}`);
  console.log(`📡 Health check    →  http://localhost:${PORT}/api/health\n`);
});
