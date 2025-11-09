#!/bin/bash

# Script to update package.json on server with create-admin script
# Run this on your server: bash UPDATE_PACKAGE_JSON.sh

echo "=== Updating package.json ==="

PACKAGE_JSON="/home/durchex/htdocs/durchex.com/backend_temp/package.json"

if [ ! -f "$PACKAGE_JSON" ]; then
    echo "❌ package.json not found: $PACKAGE_JSON"
    exit 1
fi

# Backup
cp "$PACKAGE_JSON" "${PACKAGE_JSON}.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Created backup"

# Check if script already exists
if grep -q '"create-admin"' "$PACKAGE_JSON"; then
    echo "✅ create-admin script already exists"
    exit 0
fi

# Add the script (before "test" script)
sed -i '/"test":/i\    "create-admin": "node scripts/createInitialAdmin.js",' "$PACKAGE_JSON"

echo "✅ Added create-admin script to package.json"
echo ""
echo "Now you can run: npm run create-admin"

