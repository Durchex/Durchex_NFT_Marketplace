# Deployment Sync Guide - Fixing Deployment Issues

## Problem
Your deployed site looks different from local changes because:
1. **Dual folder structure**: You have both `src/` (root) and `frontend/src/` folders
2. **Deployment might use either**: Depending on your deployment platform configuration
3. **Changes were made in root `src/`** but not synced to `frontend/src/`

## Solution: Sync All Changes

### Step 1: Check Which Files Are Different

The following files were recently updated and need to be synced:

**Recently Updated Files:**
- ✅ `src/components/EnhancedWalletConnect.jsx` → Already synced to `frontend/src/components/`
- ⚠️ `src/pages/TradingPage.jsx` → Needs sync
- ⚠️ `src/components/TokenTradingChart.jsx` → Needs sync  
- ⚠️ `src/components/AdvancedTradingInterface.jsx` → Needs sync
- ⚠️ `src/pages/Welcome.jsx` → Needs sync
- ⚠️ `src/App.jsx` → Needs sync
- ⚠️ `src/components/Header.jsx` → Needs sync
- ⚠️ `src/Context/NetworkContext.jsx` → Needs sync

### Step 2: Sync Files (Quick Method)

**Windows PowerShell:**
```powershell
# Copy all updated files from root src to frontend/src
Copy-Item -Path "src/pages/TradingPage.jsx" -Destination "frontend/src/pages/TradingPage.jsx" -Force
Copy-Item -Path "src/components/TokenTradingChart.jsx" -Destination "frontend/src/components/TokenTradingChart.jsx" -Force
Copy-Item -Path "src/components/AdvancedTradingInterface.jsx" -Destination "frontend/src/components/AdvancedTradingInterface.jsx" -Force
Copy-Item -Path "src/pages/Welcome.jsx" -Destination "frontend/src/pages/Welcome.jsx" -Force
Copy-Item -Path "src/App.jsx" -Destination "frontend/src/App.jsx" -Force
Copy-Item -Path "src/components/Header.jsx" -Destination "frontend/src/components/Header.jsx" -Force
Copy-Item -Path "src/Context/NetworkContext.jsx" -Destination "frontend/src/Context/NetworkContext.jsx" -Force
```

**Or sync entire directories:**
```powershell
# Sync all component files
Copy-Item -Path "src/components/*.jsx" -Destination "frontend/src/components/" -Force -Recurse

# Sync all page files
Copy-Item -Path "src/pages/*.jsx" -Destination "frontend/src/pages/" -Force -Recurse

# Sync context files
Copy-Item -Path "src/Context/*.jsx" -Destination "frontend/src/Context/" -Force -Recurse
```

### Step 3: Commit and Push

```bash
git add frontend/src/
git commit -m "Sync all recent changes to frontend folder for deployment"
git push origin main
```

### Step 4: Force Rebuild on Deployment Platform

**For Render.com:**
1. Go to your Render dashboard
2. Find your frontend service
3. Click "Manual Deploy" → "Clear build cache & deploy"
4. Or trigger a redeploy by making a small commit

**For VPS/CloudPanel:**
```bash
# SSH into your VPS
cd /home/cloudpanel/htdocs/yourdomain.com/

# Pull latest changes
git pull origin main

# Clear node_modules and rebuild
rm -rf node_modules package-lock.json dist
npm install
npm run build

# Copy to public directory
rm -rf public/*
cp -r dist/* public/
chown -R cloudpanel:cloudpanel public/
```

**For Vercel:**
1. Go to Vercel dashboard
2. Find your project
3. Click "Redeploy" → "Clear Cache and Redeploy"

### Step 5: Verify Deployment

1. **Clear browser cache** (Ctrl+Shift+Delete or Cmd+Shift+Delete)
2. **Hard refresh** the page (Ctrl+F5 or Cmd+Shift+R)
3. **Check browser console** for any errors
4. **Verify the changes**:
   - ✅ Wallet dropdown shows all 18 wallets
   - ✅ Trading page shows markets list first
   - ✅ Welcome page exists and works
   - ✅ Network switching works for Tezos/Hyperliquid

## Prevention: Future Sync Strategy

### Option 1: Use One Source Directory (Recommended)

**Decide which folder to use:**
- If deploying from root: Use `src/` folder only
- If deploying from frontend: Use `frontend/src/` folder only

**Update deployment config:**
- Render: Update `render.yaml` to specify correct build path
- VPS: Update build scripts to use correct directory

### Option 2: Keep Both in Sync (Current Approach)

Create a sync script that runs before deployment:

```bash
#!/bin/bash
# sync-for-deployment.sh

echo "Syncing files from root src to frontend/src..."

# Copy all source files
cp -r src/* frontend/src/

echo "Sync complete!"
```

Add to `package.json`:
```json
{
  "scripts": {
    "prebuild": "npm run sync",
    "sync": "node sync-files.js"
  }
}
```

### Option 3: Use Symbolic Links (Advanced)

Create symbolic links so both folders point to the same files:
```bash
# Remove frontend/src
rm -rf frontend/src

# Create symlink
ln -s ../src frontend/src
```

## Troubleshooting

### Issue: Changes still not showing after deployment

1. **Check build logs** on your deployment platform
2. **Verify environment variables** are set correctly
3. **Clear CDN cache** if using a CDN (Cloudflare, etc.)
4. **Check if build is using correct directory**:
   - Look at build logs for "Building from..." or "Source directory..."

### Issue: Build failing

1. **Check Node version** matches locally (usually 18.x)
2. **Verify all dependencies** are in package.json
3. **Check for TypeScript errors** if using TypeScript
4. **Review build logs** for specific error messages

### Issue: Different files in different locations

Use this to find differences:
```bash
# Compare files
diff src/components/EnhancedWalletConnect.jsx frontend/src/components/EnhancedWalletConnect.jsx

# Or use a tool like Beyond Compare or WinMerge
```

## Quick Fix Script

Save this as `sync-all.sh`:

```bash
#!/bin/bash
echo "🔄 Syncing all changes to frontend folder..."

# Sync components
cp -r src/components/*.jsx frontend/src/components/ 2>/dev/null || true

# Sync pages  
cp -r src/pages/*.jsx frontend/src/pages/ 2>/dev/null || true

# Sync context
cp -r src/Context/*.jsx frontend/src/Context/ 2>/dev/null || true

# Sync App.jsx
cp src/App.jsx frontend/src/App.jsx 2>/dev/null || true

echo "✅ Sync complete!"
echo "📝 Don't forget to: git add frontend/src/ && git commit && git push"
```

Make it executable and run:
```bash
chmod +x sync-all.sh
./sync-all.sh
```

