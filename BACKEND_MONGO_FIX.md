# URGENT: Credential Rotation & Backend Mongo Fix

**Status: CRITICAL SECURITY ISSUE** ⚠️  
Exposed credentials in git history:
- ✅ MongoDB password: `Durchex2025..` 
- ✅ Pinata API keys
- ✅ Alchemy/Chainstack RPC URLs
- ✅ SMTP credentials

---

## Phase 1: Diagnose Mongo Connection (5 minutes)

### Step 1: SSH to Server
```bash
ssh root@213.130.144.229
```

### Step 2: Test Mongo Connection String
```bash
node -e "
const uri = 'mongodb+srv://durchex_db_user:Durchex2025..@durchex-cluster.otgf1xa.mongodb.net/?appName=durchex-cluster';
console.log('Connection string:', uri);
"
```

### Step 3: Check Backend Logs for Mongo Errors
```bash
pm2 logs durchex-backend --lines 100 | grep -i "mongo\|database\|ECONNREFUSED"
```

**Expected errors to look for:**
```
❌ ECONNREFUSED 127.0.0.1:27017   → Mongo daemon not running locally
❌ ECONNREFUSED ::1:27017          → IPv6 localhost not reachable
❌ getaddrinfo ENOTFOUND           → DNS issue with Atlas cluster
❌ authentication failed            → Wrong password
```

### Step 4: Verify MongoDB Atlas Access
Go to: https://cloud.mongodb.com → Network Access

Check:
- ✅ IP whitelist includes **213.130.144.229** (or 0.0.0.0/0 for any)
- ✅ Database user `durchex_db_user` exists and is active
- ✅ Password matches what's in `.env`

---

## Phase 2: Fix Backend Mongo Connection (10 minutes)

### Option A: Use MongoDB Atlas (Recommended - Cloud)

**Advantages:** Always available, automatic backups, no local setup

```bash
# 1. SSH to server
ssh root@213.130.144.229

# 2. Edit backend .env
sudo nano /home/durchex/htdocs/durchex.com/backend_temp/.env

# 3. Verify DATABASE line is:
# DATABASE=mongodb+srv://durchex_db_user:Durchex2025..@durchex-cluster.otgf1xa.mongodb.net/?appName=durchex-cluster

# 4. Check if it's correct, restart backend
pm2 restart durchex-backend

# 5. Monitor logs
pm2 logs durchex-backend --lines 50
```

Look for:
```
✅ "✅ Database connection successful!"
```

### Option B: Use Local MongoDB (Alternative)

If you want local Mongo instead:

```bash
# 1. Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# 2. Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# 3. Create database user
mongosh << 'EOF'
use durchex-nft-marketplace
db.createUser({
  user: "durchex_db_user",
  pwd: "NEW_SECURE_PASSWORD_HERE",
  roles: ["dbOwner", "readWrite"]
})
EOF

# 4. Update backend .env
DATABASE=mongodb://durchex_db_user:NEW_SECURE_PASSWORD_HERE@127.0.0.1:27017/durchex-nft-marketplace

# 5. Restart backend
pm2 restart durchex-backend
pm2 logs durchex-backend --lines 50
```

---

## Phase 3: IMMEDIATE Credential Rotation (⚠️ URGENT)

### ❗ DO THIS TODAY

#### 1. MongoDB Password Rotation
```
1. Go to: https://cloud.mongodb.com
2. Click "Security" → "Database Access"
3. Find user: durchex_db_user
4. Click "Edit" → "Edit Password"
5. Generate NEW password (use auto-generate)
6. Copy new password
7. Update .env on server: DATABASE=mongodb+srv://durchex_db_user:NEW_PASSWORD@...
8. Restart backend: pm2 restart durchex-backend
9. Verify: curl http://durchex.com/api/health
10. ✅ Confirm it works, then REVOKE old password
```

**How to revoke old password:**
```
1. Same location as above
2. Click the old password entry (if shown in history)
3. Delete or mark as inactive
```

#### 2. Pinata API Keys Rotation
```
1. Go to: https://app.pinata.cloud/keys
2. Click "New Key" → give it a name
3. Copy new API Key and Secret
4. Update frontend/.env:
   VITE_PINATA_API_KEY=<new_key>
   VITE_PINATA_SECRET_KEY=<new_secret>
5. Revoke old keys: click the old key → "Delete"
```

#### 3. RPC Keys (Alchemy/Chainstack) Rotation
```
1. Go to Chainstack: https://console.chainstack.com
   - Find project → click it
   - Find the RPC endpoint for Polygon
   - Click "Regenerate Key"
   - Copy new key
   - Update: VITE_CHAINSTACK_KEY=<new_key> OR update RPC URL

2. Go to Alchemy: https://dashboard.alchemy.com
   - Click your app
   - Settings → "View Key"
   - Click "Regenerate"
   - Copy new key and update URLs
```

#### 4. Update .env Files on Server
```bash
ssh root@213.130.144.229

# Backend
sudo nano /home/durchex/htdocs/durchex.com/backend_temp/.env
# Update: DATABASE, PINATA keys

# Frontend (needs rebuild)
sudo nano /home/durchex/htdocs/durchex.com/frontend/.env
# Update: VITE_PINATA_API_KEY, RPC URLs

# Rebuild frontend
cd /home/durchex/htdocs/durchex.com/frontend
npm run build

# Restart backend
pm2 restart durchex-backend
```

#### 5. Clean Git History (Remove Exposed Credentials)
```bash
# LOCAL MACHINE - in repo root
git log --all --full-history -- "*/\.env"

# Rewrite history to remove .env files
git filter-branch --tree-filter 'find . -name ".env" -delete' --prune-empty -f

# Force push
git push origin main -f
```

⚠️ **WARNING:** Force push rewrites history for all collaborators. Do this ONLY if:
- No one else is relying on current main branch
- It's acceptable to reset all remote branches

**Better alternative:**
```bash
# Add .env to .gitignore (if not already there)
echo ".env" >> .gitignore
echo "backend_temp/.env" >> .gitignore
git add .gitignore
git commit -m "Add .env to gitignore - credentials removed from repo"
git push origin main

# Then manually rotate all credentials (do steps 1-4 above)
```

---

## Phase 4: Verify Everything Works (5 minutes)

After rotating credentials:

```bash
# 1. Test backend health
curl http://durchex.com/api/health

# 2. Test NFT fetch
curl http://durchex.com/api/v1/nft/nfts/ethereum | jq . | head -20

# 3. Check frontend (browser)
# - Open: http://durchex.com
# - Go to Explore page
# - Should see NFTs loading (either real or mock fallback)

# 4. Monitor logs
pm2 logs durchex-backend --lines 50
pm2 logs durchex-frontend --lines 50 # if running
```

---

## Checklist: Completion Status

```
Credential Rotation:
- [ ] MongoDB password rotated
- [ ] Pinata keys regenerated
- [ ] RPC keys (Alchemy/Chainstack) regenerated
- [ ] .env files updated on server
- [ ] Old credentials revoked in respective dashboards
- [ ] Git history cleaned or new .gitignore committed

Backend Connectivity:
- [ ] Mongo connection test passed (pm2 logs shows success)
- [ ] curl /api/health returns 200
- [ ] curl /api/v1/nft/nfts/<network> returns data (or empty, not 500)
- [ ] pm2 logs show NO authentication errors

Frontend:
- [ ] Explore page loads NFTs (real or fallback mock data)
- [ ] No RPC 401 errors in browser console
- [ ] Wallet connections work

Ops:
- [ ] nginx proxy to 8080 verified working
- [ ] SSL certificate installed (Certbot)
- [ ] All services restarted and stable
```

---

## Quick Commands Reference

```bash
# SSH
ssh root@213.130.144.229

# Check process status
ss -ltnp | grep -E ':(80|8080|27017)'

# Backend logs
pm2 logs durchex-backend --lines 100

# Restart backend
pm2 restart durchex-backend

# Reload nginx
sudo systemctl reload nginx
sudo nginx -t

# Test API
curl -v http://durchex.com/api/health
curl http://durchex.com/api/v1/nft/nfts/ethereum | jq .

# Edit env
sudo nano /home/durchex/htdocs/durchex.com/backend_temp/.env
```

---

## Questions?

If you hit any errors:
1. Post **pm2 logs** (last 50 lines) showing the error
2. Include **curl output** of `/api/health`
3. Include **browser console errors** (F12 → Console tab)

I'll diagnose and provide exact fix.

