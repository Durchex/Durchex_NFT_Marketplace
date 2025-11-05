#!/bin/bash

# Fix 403 Forbidden Error Script for CloudPanel
# Usage: sudo ./fix-403.sh [domain]

set -e

DOMAIN="${1:-yourdomain.com}"
SITE_PATH="/home/cloudpanel/htdocs/${DOMAIN}"
PUBLIC_PATH="${SITE_PATH}/public"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🔧 Fixing 403 Forbidden Error for ${DOMAIN}${NC}"
echo ""

# Check if directory exists
if [ ! -d "$SITE_PATH" ]; then
    echo -e "${RED}❌ Site directory not found: ${SITE_PATH}${NC}"
    echo -e "${YELLOW}Usage: sudo ./fix-403.sh yourdomain.com${NC}"
    exit 1
fi

# Step 1: Fix ownership
echo -e "${GREEN}[1/6] Setting ownership...${NC}"
chown -R cloudpanel:cloudpanel "$SITE_PATH" 2>/dev/null || \
chown -R www-data:www-data "$SITE_PATH" 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Could not set ownership. You may need to run as root.${NC}"
}

# Step 2: Fix directory permissions
echo -e "${GREEN}[2/6] Setting directory permissions...${NC}"
if [ -d "$PUBLIC_PATH" ]; then
    find "$PUBLIC_PATH" -type d -exec chmod 755 {} \; 2>/dev/null || true
else
    echo -e "${YELLOW}⚠️  Public directory not found. Creating...${NC}"
    mkdir -p "$PUBLIC_PATH"
    chmod 755 "$PUBLIC_PATH"
fi

# Step 3: Fix file permissions
echo -e "${GREEN}[3/6] Setting file permissions...${NC}"
if [ -d "$PUBLIC_PATH" ]; then
    find "$PUBLIC_PATH" -type f -exec chmod 644 {} \; 2>/dev/null || true
fi

# Step 4: Ensure parent directories have correct permissions
echo -e "${GREEN}[4/6] Fixing parent directory permissions...${NC}"
chmod 755 /home/cloudpanel/htdocs/ 2>/dev/null || true
chmod 755 /home/cloudpanel/htdocs/${DOMAIN}/ 2>/dev/null || true
chmod 755 "$PUBLIC_PATH" 2>/dev/null || true

# Step 5: Check if index.html exists
echo -e "${GREEN}[5/6] Checking for index.html...${NC}"
if [ ! -f "$PUBLIC_PATH/index.html" ]; then
    echo -e "${YELLOW}⚠️  index.html not found in public directory${NC}"
    
    # Check if dist folder exists and has index.html
    if [ -f "$SITE_PATH/dist/index.html" ]; then
        echo -e "${YELLOW}Found index.html in dist folder. Copying...${NC}"
        cp -r "$SITE_PATH/dist/"* "$PUBLIC_PATH/" 2>/dev/null || true
        chown -R cloudpanel:cloudpanel "$PUBLIC_PATH" 2>/dev/null || true
        find "$PUBLIC_PATH" -type d -exec chmod 755 {} \; 2>/dev/null || true
        find "$PUBLIC_PATH" -type f -exec chmod 644 {} \; 2>/dev/null || true
    else
        echo -e "${RED}❌ index.html not found. Please build your project first:${NC}"
        echo -e "${YELLOW}   cd ${SITE_PATH}${NC}"
        echo -e "${YELLOW}   npm run build${NC}"
        echo -e "${YELLOW}   cp -r dist/* public/${NC}"
    fi
else
    echo -e "${GREEN}✓ index.html found${NC}"
fi

# Step 6: Test and reload Nginx
echo -e "${GREEN}[6/6] Testing Nginx configuration...${NC}"
if nginx -t 2>/dev/null; then
    echo -e "${GREEN}✓ Nginx configuration is valid${NC}"
    echo -e "${GREEN}Reloading Nginx...${NC}"
    systemctl reload nginx 2>/dev/null || {
        echo -e "${YELLOW}⚠️  Could not reload Nginx. You may need to:${NC}"
        echo -e "${YELLOW}   systemctl reload nginx${NC}"
        echo -e "${YELLOW}   Or reload via CloudPanel: Sites → Your Site → Reload Nginx${NC}"
    }
    echo -e "${GREEN}✅ Nginx reloaded${NC}"
else
    echo -e "${RED}❌ Nginx configuration has errors!${NC}"
    echo -e "${YELLOW}Please fix nginx configuration before reloading.${NC}"
    echo -e "${YELLOW}Check: /home/cloudpanel/htdocs/${DOMAIN}/conf/nginx.conf${NC}"
    exit 1
fi

# Summary
echo ""
echo -e "${GREEN}✅ Fix completed!${NC}"
echo ""
echo -e "${YELLOW}Summary:${NC}"
echo -e "  - Ownership: cloudpanel:cloudpanel"
echo -e "  - Directories: 755"
echo -e "  - Files: 644"
echo -e "  - Nginx: Reloaded"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Visit https://${DOMAIN} to test"
echo -e "  2. Check browser console for any remaining errors"
echo -e "  3. Check logs: tail -f ${PUBLIC_PATH}/../logs/error.log"
echo ""

