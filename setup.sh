#!/bin/bash
# ─── Employee Leave Portal — one-shot setup ───────────────────────────────────
set -e
echo ""
echo "🚀 Setting up Employee Leave Portal..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌  Node.js is not installed. Download it from https://nodejs.org"
  exit 1
fi

echo "✅  Node.js $(node -v) detected"

# Backend
echo ""
echo "📦  Installing backend dependencies..."
cd backend
cp .env.example .env
npm install
echo "✅  Backend ready"

# Frontend
cd ../frontend
echo ""
echo "📦  Installing frontend dependencies..."
npm install
echo "✅  Frontend ready"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅  Setup complete!"
echo ""
echo "  1. Open a terminal → cd backend → npm run dev"
echo "  2. Open another    → cd frontend → npm run dev"
echo ""
echo "  Backend  →  http://localhost:5000"
echo "  Frontend →  http://localhost:5173"
echo ""
echo "  Default admin: admin@company.com / admin123"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
