#!/bin/bash

# SSL Certificate Setup Script for Durchex NFT Marketplace
# This script installs Let's Encrypt SSL certificates using Certbot

echo "🔐 Setting up SSL certificates for durchex.com..."

# Install Certbot if not installed
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing Certbot..."
    apt update
    apt install -y certbot python3-certbot-nginx
fi

# Stop nginx temporarily (required for standalone mode)
echo "⏹️  Stopping Nginx..."
systemctl stop nginx

# Get SSL certificate
echo "🔐 Obtaining SSL certificate for durchex.com..."
certbot certonly --standalone -d durchex.com -d www.durchex.com

# Start nginx again
echo "▶️  Starting Nginx..."
systemctl start nginx

# Test certificate renewal
echo "🔄 Testing certificate renewal..."
certbot renew --dry-run

# Show certificate info
echo "📋 Certificate information:"
certbot certificates

echo "✅ SSL setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update your nginx config to use the SSL paths:"
echo "   ssl_certificate /etc/letsencrypt/live/durchex.com/fullchain.pem;"
echo "   ssl_certificate_key /etc/letsencrypt/live/durchex.com/privkey.pem;"
echo ""
echo "2. Test your SSL setup:"
echo "   curl -I https://durchex.com/"
echo ""
echo "3. Set up auto-renewal:"
echo "   crontab -e"
echo "   Add: 0 12 * * * /usr/bin/certbot renew --quiet"