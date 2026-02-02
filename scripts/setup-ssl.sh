#!/bin/bash
# =========================================
# SSL Certificate Setup with Let's Encrypt
# Raphael's Horizon
# =========================================

set -e

DOMAIN=${1:-"api.raphaelshorizon.com"}
EMAIL=${2:-"admin@raphaelshorizon.com"}

echo "🔐 Setting up SSL for domain: $DOMAIN"
echo "Email: $EMAIL"

# Install certbot
apt-get install -y certbot

# Stop any running services on port 80
docker-compose -f docker-compose.prod.yml down || true

# Get certificate
certbot certonly --standalone \
    -d $DOMAIN \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --non-interactive

# Create ssl directory
mkdir -p /opt/raphaelshorizon/ssl

# Copy certificates
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /opt/raphaelshorizon/ssl/
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /opt/raphaelshorizon/ssl/

# Set permissions
chmod 600 /opt/raphaelshorizon/ssl/*.pem

echo "✅ SSL certificates installed!"
echo ""
echo "Certificates copied to /opt/raphaelshorizon/ssl/"
echo ""
echo "Setting up auto-renewal..."

# Add cron job for renewal
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'cp /etc/letsencrypt/live/$DOMAIN/*.pem /opt/raphaelshorizon/ssl/ && docker-compose -f /opt/raphaelshorizon/docker-compose.prod.yml restart nginx'") | crontab -

echo "✅ Auto-renewal cron job added!"
