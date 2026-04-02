#!/usr/bin/env bash
set -euo pipefail

echo "=== StressLab AI Dev Server ==="
echo ""
echo "Starting backend (port 8000) and frontend (port 5173)..."
echo ""

trap 'kill 0' EXIT

cd "$(dirname "$0")/.."

(cd apps/api && python3 -m uvicorn app.main:app --reload --port 8000) &
(cd apps/web && npm run dev) &

wait
