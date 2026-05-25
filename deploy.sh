#!/bin/bash
# ------------------------------------------------------------------
# Semen Connect - Production Deployment Script
# ------------------------------------------------------------------

echo "🚀 Starting Deployment Process for Semen Connect..."

# 1. Pull the latest code (uncomment if using Git on the server)
# echo "📥 Pulling latest code..."
# git pull origin main

# 2. Install Dependencies
echo "📦 Installing backend and frontend dependencies..."
npm run install-all

# 3. Build Frontend
echo "🏗️ Building the React frontend for production..."
npm run build

# 4. Restart or Start the Application using PM2
echo "🔄 Starting application with PM2..."
# Check if PM2 is installed globally, if not prompt the user
if ! command -v pm2 &> /dev/null
then
    echo "⚠️ PM2 could not be found. Installing PM2 globally..."
    npm install -g pm2
fi

# Reload the application with zero-downtime using the ecosystem file
pm2 start ecosystem.config.js --env production --update-env
pm2 save

echo "✅ Deployment Successful! The application is running in the background."
pm2 status
