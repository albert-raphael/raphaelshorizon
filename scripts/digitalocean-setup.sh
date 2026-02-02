#!/bin/bash
# =========================================
# DigitalOcean Droplet Setup Script
# Raphael's Horizon - Backend & Services
# =========================================

set -e  # Exit on error

echo "🚀 Starting DigitalOcean Droplet Setup..."
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
apt-get update && apt-get upgrade -y

# Install required packages
echo -e "${YELLOW}📦 Installing required packages...${NC}"
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    ufw

# Install Docker
echo -e "${YELLOW}🐳 Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
else
    echo -e "${GREEN}Docker already installed${NC}"
fi

# Install Docker Compose
echo -e "${YELLOW}🐳 Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo -e "${GREEN}Docker Compose already installed${NC}"
fi

# Configure Firewall
echo -e "${YELLOW}🔒 Configuring firewall...${NC}"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Create app directory
echo -e "${YELLOW}📁 Creating application directory...${NC}"
mkdir -p /opt/raphaelshorizon
cd /opt/raphaelshorizon

echo -e "${GREEN}✅ System setup complete!${NC}"
echo ""
echo "==========================================="
echo "Next steps:"
echo "1. Clone your repository to /opt/raphaelshorizon"
echo "2. Copy .env.production to .env"
echo "3. Set up SSL certificates"
echo "4. Run: docker-compose -f docker-compose.prod.yml up -d"
echo "==========================================="
