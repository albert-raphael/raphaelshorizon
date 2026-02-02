#!/bin/bash
# =========================================
# Deploy Application to DigitalOcean
# Raphael's Horizon
# =========================================

set -e

APP_DIR="/opt/raphaelshorizon"
REPO_URL="https://github.com/albert-raphael/raphaelshorizon.git"

echo "🚀 Deploying Raphael's Horizon..."

cd $APP_DIR

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Copy environment file if not exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Please create one from .env.production"
    echo "Run: cp .env.production .env"
    echo "Then edit .env with your actual values"
    exit 1
fi

# Build and start containers
echo "🐳 Building and starting containers..."
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check health
echo "🔍 Checking service health..."
docker-compose -f docker-compose.prod.yml ps

# Test endpoints
echo ""
echo "🔗 Testing endpoints..."
curl -s http://localhost/health || echo "Health check failed"
curl -s http://localhost/api/health || echo "API health check failed"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Services running:"
echo "  - Backend API: http://localhost/api/"
echo "  - Audiobookshelf: http://localhost/audiobookshelf/"
echo "  - Calibre-Web: http://localhost/calibre/"
