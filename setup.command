#!/bin/zsh
set -e
cd "$(dirname "$0")"

echo "Roaring Fork Local — local setup"
echo "================================="

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed. Install Node.js 22 LTS or newer, then run this file again."
  read -k 1 "?Press any key to close..."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is not available. Reinstall Node.js, then run this file again."
  read -k 1 "?Press any key to close..."
  exit 1
fi

if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "Created .env.local from .env.example"
fi

echo "Installing dependencies..."
npm install

echo ""
echo "Starting Roaring Fork Local at http://localhost:3000"
echo "Press Control-C in this window to stop the server."
echo ""
npm run dev
