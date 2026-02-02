#!/bin/bash

# Raphael's Horizon Deployment Script
# This script handles the complete deployment of the application

set -e  # Exit on any error

echo "🚀 Starting Raphael's Horizon Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Project structure verified"

# Backend deployment
print_status "Deploying backend..."

cd backend

# Install backend dependencies
print_status "Installing backend dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    print_warning "Creating .env file - please update with your actual values"
    cat > .env << EOL
NODE_ENV=production
PORT=8000
JWT_SECRET=your-super-secret-jwt-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
FRONTEND_URL=https://yourdomain.com
EOL
fi

# Build backend (if needed)
print_status "Backend setup complete"

cd ..

# Frontend deployment
print_status "Deploying frontend..."

cd frontend

# Install frontend dependencies
print_status "Installing frontend dependencies..."
npm install

# Build frontend for production
print_status "Building frontend for production..."
npm run build

cd ..

# Copy built frontend to backend public directory
print_status "Copying built frontend to backend..."
if [ -d "frontend/dist" ]; then
    cp -r frontend/dist/* backend/public/
    print_success "Frontend copied to backend/public/"
elif [ -d "frontend/build" ]; then
    cp -r frontend/build/* backend/public/
    print_success "Frontend copied to backend/public/"
else
    print_warning "No dist or build directory found - manual copy may be needed"
fi

print_success "Deployment preparation complete!"
print_status ""
print_status "Next steps:"
print_status "1. Update the .env file in backend/ with your actual credentials"
print_status "2. Test the application locally: cd backend && npm start"
print_status "3. For production deployment, consider using:"
print_status "   - Vercel for frontend"
print_status "   - Render/Heroku for backend"
print_status "   - MongoDB Atlas for database"
print_status ""
print_success "🎉 Raphael's Horizon is ready for deployment!"