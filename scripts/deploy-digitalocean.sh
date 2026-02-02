#!/bin/bash
# DigitalOcean Deployment Script

# Stop on error
set -e

echo "🚀 Starting deployment on DigitalOcean..."

# Navigate to project directory
cd /opt/raphaelshorizon

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Rebuild and restart backend services
echo "🔄 Rebuilding services..."
docker compose -f docker-compose.prod.yml up -d --build --remove-orphans

# Prune unused images to save space
docker image prune -f

echo "✅ Deployment complete!"