#!/bin/zsh
set -e

cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Install Node.js 22 LTS or newer, then run this file again."
  exit 1
fi

if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "Created .env.local from .env.example"
fi

echo "Installing dependencies..."
npm install

echo ""
echo "Starting Roaring Fork Local..."
echo "Open http://localhost:3000 in your browser."
npm run dev
