#!/bin/bash

# Fix script for backend crash issues
# Run this in the backend directory: /home/durchex/htdocs/durchex.com/backend_temp

echo "=== Fixing Backend Crash Issues ==="
echo ""

# Check Node.js version
echo "1. Checking Node.js version:"
echo "-----------------------------------"
node --version
npm --version

# Check if Node.js version is compatible (should be 18+)
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  WARNING: Node.js version is below 18. Undici requires Node 18+"
    echo "   Consider upgrading Node.js"
fi

echo ""
echo "2. Stopping PM2 process:"
echo "-----------------------------------"
pm2 stop durchex-backend
pm2 delete durchex-backend

echo ""
echo "3. Checking package.json for undici dependency:"
echo "-----------------------------------"
if [ -f "package.json" ]; then
    grep -i "undici\|ethers" package.json || echo "   Not found in package.json"
else
    echo "   package.json not found"
fi

echo ""
echo "4. Fixing undici/File issue - Reinstalling dependencies:"
echo "-----------------------------------"
echo "   Removing node_modules and package-lock.json..."
rm -rf node_modules package-lock.json

echo "   Installing dependencies..."
npm install

echo ""
echo "5. Checking for .env file:"
echo "-----------------------------------"
if [ -f ".env" ]; then
    echo "   ✅ .env file exists"
    # Check for required blockchain RPC URLs
    if grep -q "ETHEREUM_RPC_URL\|POLYGON_RPC_URL\|ARBITRUM_RPC_URL" .env; then
        echo "   ✅ Blockchain RPC URLs found"
    else
        echo "   ⚠️  WARNING: Blockchain RPC URLs might be missing"
    fi
else
    echo "   ❌ .env file NOT found - this is required!"
fi

echo ""
echo "6. Testing if server can start (dry run):"
echo "-----------------------------------"
# Just check if server.js can be parsed
node -c server.js && echo "   ✅ server.js syntax is valid" || echo "   ❌ server.js has syntax errors"

echo ""
echo "=== Restarting Backend ==="
echo ""
echo "Starting backend with PM2..."
pm2 start ecosystem.config.cjs

echo ""
echo "Waiting 5 seconds for startup..."
sleep 5

echo ""
echo "Checking if backend is listening on port 3000:"
lsof -i :3000 || netstat -tlnp | grep :3000 || echo "   ⚠️  Still not listening on port 3000"

echo ""
echo "Checking PM2 status:"
pm2 list

echo ""
echo "Recent logs:"
pm2 logs durchex-backend --lines 20 --nostream

echo ""
echo "=== If still not working ==="
echo ""
echo "Check logs for errors:"
echo "  pm2 logs durchex-backend --lines 100"
echo ""
echo "If undici error persists, try:"
echo "  npm install undici@latest"
echo "  OR"
echo "  npm install ethers@latest"
echo ""
echo "If blockchain providers still fail, check .env has:"
echo "  ETHEREUM_RPC_URL=..."
echo "  POLYGON_RPC_URL=..."
echo "  ARBITRUM_RPC_URL=..."
echo "  etc."
