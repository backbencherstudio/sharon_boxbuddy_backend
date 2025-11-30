#!/bin/bash
set -e

APP_DIR="/var/www/backend"

echo ">>> Updating code..."
cd $APP_DIR
git pull origin main

echo ">>> Installing dependencies..."
if [ -f "package.json" ]; then
  npm install --production
fi

if [ -f "requirements.txt" ]; then
  pip install -r requirements.txt
fi

echo ">>> Restarting service..."
if command -v pm2 &> /dev/null; then
  pm2 restart all
elif command -v systemctl &> /dev/null; then
  sudo systemctl restart backend
fi

echo ">>> Done!"
