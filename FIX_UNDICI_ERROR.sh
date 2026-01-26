#!/bin/bash

# Fix script for undici File is not defined error
# This error typically occurs with Node.js version mismatches

echo "=== Fixing Undici Error ==="
echo ""

# 1. Check Node.js version
echo "1. Checking Node.js version:"
echo "-----------------------------------"
NODE_VERSION=$(node --version)
echo "Current Node.js version: $NODE_VERSION"
NODE_MAJOR=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
echo "Major version: $NODE_MAJOR"

if [ "$NODE_MAJOR" -lt 18 ]; then
    echo "⚠️  WARNING: Node.js version is below 18"
    echo "   The File API requires Node.js 18+"
    echo "   Consider upgrading Node.js"
fi

echo ""
echo "2. Checking if File API is available:"
echo "-----------------------------------"
node -e "console.log(typeof File !== 'undefined' ? 'File API available' : 'File API NOT available')" 2>&1

echo ""
echo "3. Stopping PM2 process:"
echo "-----------------------------------"
pm2 stop durchex-backend
pm2 delete durchex-backend

echo ""
echo "4. Fixing undici issue - Option 1: Update undici:"
echo "-----------------------------------"
npm install undici@latest --save

echo ""
echo "5. Alternative: Downgrade undici to a compatible version:"
echo "-----------------------------------"
echo "   If latest doesn't work, try:"
echo "   npm install undici@5.28.2 --save"
echo "   (This version doesn't require File API)"

echo ""
echo "6. Check ethers dependency:"
echo "-----------------------------------"
npm list ethers

echo ""
echo "7. Reinstall all dependencies:"
echo "-----------------------------------"
rm -rf node_modules package-lock.json
npm install

echo ""
echo "8. Test if server can start:"
echo "-----------------------------------"
# Test if server.js can be loaded without errors
timeout 10 node server.js 2>&1 | head -20 || echo "Server test completed"

echo ""
echo "9. Restart with PM2:"
echo "-----------------------------------"
pm2 start ecosystem.config.cjs
pm2 save

echo ""
echo "10. Wait and check status:"
echo "-----------------------------------"
sleep 5
pm2 list
lsof -i :3000 || netstat -tlnp | grep :3000 || echo "⚠️  Still not listening on port 3000"

echo ""
echo "11. Check logs:"
echo "-----------------------------------"
pm2 logs durchex-backend --lines 20 --nostream

echo ""
echo "=== If still failing ==="
echo ""
echo "The undici error might be due to:"
echo "1. Node.js version too old (need 18+)"
echo "2. PM2 interfering with module loading"
echo "3. Corrupted node_modules"
echo ""
echo "Try these additional fixes:"
echo ""
echo "# Option A: Use Node.js 18+"
echo "  nvm install 18"
echo "  nvm use 18"
echo "  npm install"
echo ""
echo "# Option B: Pin undici to older version"
echo "  npm install undici@5.28.2 --save-exact"
echo ""
echo "# Option C: Remove undici dependency if not needed"
echo "  npm uninstall undici"
echo "  (Only if no other packages require it)"
