#!/bin/bash

# Fix script for @elastic/transport undici error
# The issue is in a nested dependency

echo "=== Fixing @elastic/transport undici Error ==="
echo ""

# 1. Check Node.js version
echo "1. Checking Node.js version:"
echo "-----------------------------------"
NODE_VERSION=$(node --version)
NODE_MAJOR=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
NODE_MINOR=$(node --version | cut -d'v' -f2 | cut -d'.' -f2)
echo "Current: $NODE_VERSION (Major: $NODE_MAJOR, Minor: $NODE_MINOR)"

if [ "$NODE_MAJOR" -lt 18 ] || ([ "$NODE_MAJOR" -eq 18 ] && [ "$NODE_MINOR" -lt 20 ]); then
    echo "⚠️  Node.js version is too old for File API"
    echo "   File API requires Node.js 18.20+ or 20+"
    echo "   Current version doesn't support File API"
fi

echo ""
echo "2. Stopping PM2:"
echo "-----------------------------------"
pm2 stop durchex-backend
pm2 delete durchex-backend

echo ""
echo "3. Finding what uses @elastic/transport:"
echo "-----------------------------------"
grep -r "@elastic" package.json package-lock.json 2>/dev/null | head -5

echo ""
echo "4. Fix Option 1: Update @elastic/transport:"
echo "-----------------------------------"
npm install @elastic/transport@latest --save

echo ""
echo "5. Fix Option 2: Force undici version in nested dependency:"
echo "-----------------------------------"
# Create or update .npmrc to force undici version
echo "undici=5.28.2" >> .npmrc 2>/dev/null || echo "package-lock-only=true" > .npmrc

echo ""
echo "6. Fix Option 3: Remove and reinstall @elastic packages:"
echo "-----------------------------------"
# Find elastic packages
ELASTIC_PKGS=$(npm list --depth=0 2>/dev/null | grep -i elastic | awk '{print $2}' | cut -d'@' -f1)
if [ -n "$ELASTIC_PKGS" ]; then
    echo "Found Elastic packages: $ELASTIC_PKGS"
    for pkg in $ELASTIC_PKGS; do
        echo "Reinstalling $pkg..."
        npm uninstall $pkg
        npm install $pkg@latest
    done
fi

echo ""
echo "7. Clean reinstall all dependencies:"
echo "-----------------------------------"
rm -rf node_modules package-lock.json
npm install

echo ""
echo "8. Fix Option 4: Manually fix nested undici:"
echo "-----------------------------------"
if [ -d "node_modules/@elastic/transport/node_modules/undici" ]; then
    echo "Found nested undici, updating it..."
    cd node_modules/@elastic/transport/node_modules/undici
    npm install undici@5.28.2 --save-exact 2>/dev/null || echo "Could not update nested undici"
    cd ../../../../..
fi

echo ""
echo "9. Alternative: Use npm overrides to force undici version:"
echo "-----------------------------------"
# Check if package.json has overrides section
if ! grep -q '"overrides"' package.json 2>/dev/null; then
    echo "Adding npm overrides to package.json..."
    # This would need to be done manually or with a more sophisticated script
    echo "   Manually add this to package.json:"
    echo '   "overrides": {'
    echo '     "undici": "5.28.2"'
    echo '   }'
fi

echo ""
echo "10. Restart backend:"
echo "-----------------------------------"
pm2 start ecosystem.config.cjs
pm2 save

echo ""
echo "11. Check status:"
echo "-----------------------------------"
sleep 5
pm2 list
lsof -i :3000 || echo "⚠️  Still not listening"

echo ""
echo "12. Check logs:"
echo "-----------------------------------"
pm2 logs durchex-backend --lines 30 --nostream | tail -30

echo ""
echo "=== If still failing ==="
echo ""
echo "The File API requires Node.js 18.20+ or 20+"
echo ""
echo "Upgrade Node.js:"
echo "  # Using nvm:"
echo "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
echo "  source ~/.bashrc"
echo "  nvm install 20"
echo "  nvm use 20"
echo "  nvm alias default 20"
echo ""
echo "  # Then reinstall:"
echo "  cd /home/durchex/htdocs/durchex.com/backend_temp"
echo "  rm -rf node_modules package-lock.json"
echo "  npm install"
echo "  pm2 start ecosystem.config.cjs"
