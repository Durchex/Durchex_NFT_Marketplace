#!/bin/bash

# Durchex NFT Marketplace Deployment Script for CloudPanel VPS
# Usage: ./deploy.sh [production|staging]

set -e  # Exit on error

ENVIRONMENT=${1:-production}
DOMAIN="${DOMAIN:-yourdomain.com}"
SITE_PATH="/home/cloudpanel/htdocs/${DOMAIN}"
PUBLIC_PATH="${SITE_PATH}/public"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Durchex NFT Marketplace Deployment${NC}"
echo -e "${YELLOW}Environment: ${ENVIRONMENT}${NC}"
echo -e "${YELLOW}Domain: ${DOMAIN}${NC}"
echo ""

# Check if running as root or cloudpanel user
if [ "$EUID" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Running as root. Consider using cloudpanel user.${NC}"
fi

# Step 1: Navigate to project directory
echo -e "${GREEN}[1/7] Navigating to project directory...${NC}"
if [ ! -d "$SITE_PATH" ]; then
    echo -e "${RED}❌ Directory $SITE_PATH does not exist!${NC}"
    echo -e "${YELLOW}Please create the site in CloudPanel first.${NC}"
    exit 1
fi
cd "$SITE_PATH"

# Step 2: Check if .git exists (for git pull)
echo -e "${GREEN}[2/7] Checking for git repository...${NC}"
if [ -d ".git" ]; then
    echo -e "${YELLOW}Found git repository. Pulling latest changes...${NC}"
    git pull origin main || git pull origin master
else
    echo -e "${YELLOW}No git repository found. Continuing with local files...${NC}"
fi

# Step 3: Install/Update dependencies
echo -e "${GREEN}[3/7] Installing dependencies...${NC}"
if [ -f "package.json" ]; then
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${RED}❌ package.json not found!${NC}"
    exit 1
fi

# Step 4: Load environment variables
echo -e "${GREEN}[4/7] Loading environment variables...${NC}"
if [ -f ".env.${ENVIRONMENT}" ]; then
    echo -e "${YELLOW}Using .env.${ENVIRONMENT}${NC}"
    export $(cat .env.${ENVIRONMENT} | grep -v '^#' | xargs)
elif [ -f ".env.production" ]; then
    echo -e "${YELLOW}Using .env.production${NC}"
    export $(cat .env.production | grep -v '^#' | xargs)
elif [ -f ".env" ]; then
    echo -e "${YELLOW}Using .env${NC}"
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${YELLOW}⚠️  No environment file found. Using defaults.${NC}"
fi

# Step 5: Build the project
echo -e "${GREEN}[5/7] Building project...${NC}"
if [ "$ENVIRONMENT" = "production" ]; then
    npm run build
else
    npm run build
fi

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed! No dist folder found.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build completed successfully${NC}"

# Step 6: Backup current public directory
echo -e "${GREEN}[6/7] Creating backup...${NC}"
if [ -d "$PUBLIC_PATH" ] && [ "$(ls -A $PUBLIC_PATH)" ]; then
    BACKUP_DIR="${PUBLIC_PATH}.backup.$(date +%Y%m%d_%H%M%S)"
    cp -r "$PUBLIC_PATH" "$BACKUP_DIR"
    echo -e "${GREEN}✓ Backup created: $BACKUP_DIR${NC}"
fi

# Step 7: Deploy build files
echo -e "${GREEN}[7/7] Deploying build files...${NC}"

# Create public directory if it doesn't exist
mkdir -p "$PUBLIC_PATH"

# Remove old files (except backups)
find "$PUBLIC_PATH" -type f ! -path "*.backup.*" -delete 2>/dev/null || true
find "$PUBLIC_PATH" -type d ! -path "*.backup.*" -empty -delete 2>/dev/null || true

# Copy new build files
cp -r dist/* "$PUBLIC_PATH/"

# Set proper permissions
chown -R cloudpanel:cloudpanel "$PUBLIC_PATH" 2>/dev/null || \
chown -R www-data:www-data "$PUBLIC_PATH" 2>/dev/null || \
echo -e "${YELLOW}⚠️  Could not set ownership. You may need to run as root.${NC}"

chmod -R 755 "$PUBLIC_PATH"

echo -e "${GREEN}✓ Files deployed to $PUBLIC_PATH${NC}"

# Summary
echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${YELLOW}Site URL: https://${DOMAIN}${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Test your site: https://${DOMAIN}"
echo -e "2. Check Nginx configuration for SPA routing"
echo -e "3. Verify SSL certificate is active"
echo ""

# Optional: Restart Nginx (if needed)
if command -v systemctl &> /dev/null; then
    echo -e "${YELLOW}Would you like to reload Nginx? (y/n)${NC}"
    read -t 5 -n 1 response || true
    if [[ "$response" =~ ^[Yy]$ ]]; then
        systemctl reload nginx
        echo -e "${GREEN}✓ Nginx reloaded${NC}"
    fi
fi

