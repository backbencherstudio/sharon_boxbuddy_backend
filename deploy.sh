#!/bin/bash
set -e

APP_DIR="/var/www/backend"

echo ">>> Switching to app directory..."
cd $APP_DIR

echo ">>> Pulling latest code from main..."
git pull origin main

echo ">>> Installing Node dependencies..."
yarn install --production

echo ">>> Running Prisma migrations..."
npx prisma migrate deploy

echo ">>> Building Nest project..."
yarn build

echo ">>> Restarting service..."
if command -v pm2 &> /dev/null; then
  pm2 restart backend || pm2 start dist/main.js --name backend
elif command -v systemctl &> /dev/null; then
  sudo systemctl restart backend
fi

echo ">>> Deployment completed!"
