#!/usr/bin/env bash
set -e

if [ ! -f .env ]; then
    echo "Error: .env file not found. Copy .env.example and fill in values."
    exit 1
fi

echo "=== FutureAuth Template Dev Server ==="

# Install frontend deps if needed
if [ ! -d frontend/node_modules ]; then
    echo "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Run migrations
echo "Running migrations..."
cargo run --bin migrate 2>/dev/null || echo "Migration runner not yet compiled, skipping..."

# Start backend and frontend
echo "Starting backend (port 3000) and frontend (port 5173)..."
echo ""

cargo run &
BACKEND_PID=$!

cd frontend && npm run dev &
FRONTEND_PID=$!

cleanup() {
    echo ""
    echo "Shutting down..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

wait
