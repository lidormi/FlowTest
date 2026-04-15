#!/bin/bash
set -e
echo "🧪 Starting FlowTest..."
echo ""
ROOT="$(cd "$(dirname "$0")" && pwd)"

# ── Backend ────────────────────────────────────────────────────────────────────
echo "📦 Starting backend (Supabase)..."
cd "$ROOT/backend"

if [ ! -f ".env" ] || grep -q "YOUR-PROJECT-REF" .env 2>/dev/null; then
  echo ""
  echo "⚠️  DATABASE_URL not configured in backend/.env"
  echo "   1. Create a Supabase project at https://supabase.com"
  echo "   2. Settings → Database → Connection String (URI mode)"
  echo "   3. Paste into backend/.env as: DATABASE_URL=postgresql://..."
  echo "   4. Run:  cd backend && npm install && npm run seed"
  echo ""
  exit 1
fi

[ ! -d "node_modules/pg" ] && npm install
node --env-file=.env src/index.js &
BACKEND_PID=$!
echo "✅ Backend → http://localhost:3001"
sleep 2

# ── Demo Site (ShopFlow) ───────────────────────────────────────────────────────
echo ""
echo "🛍  Starting ShopFlow demo site..."
cd "$ROOT/demo-site"
[ ! -d "node_modules" ] && npm install
npx vite --port 5174 &
DEMO_PID=$!
echo "✅ ShopFlow → http://localhost:5174"
sleep 2

# ── Admin Dashboard ────────────────────────────────────────────────────────────
echo ""
echo "⚛️  Starting admin dashboard..."
cd "$ROOT/frontend"
[ ! -d "node_modules" ] && npm install
npx vite --port 5173 &
FRONTEND_PID=$!
echo "✅ Admin dashboard → http://localhost:5173"

echo ""
echo "════════════════════════════════════════════════════"
echo "🚀 All services running!"
echo ""
echo "   🔑 Admin Dashboard  →  http://localhost:5173"
echo "   🛍  ShopFlow Store   →  http://localhost:5174"
echo "   🔌 API / Backend    →  http://localhost:3001"
echo ""
echo "   Login: demo@flowtest.io / demo123"
echo "════════════════════════════════════════════════════"
echo "Press Ctrl+C to stop all services"

trap "echo ''; echo 'Stopping...'; kill \$BACKEND_PID \$DEMO_PID \$FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
