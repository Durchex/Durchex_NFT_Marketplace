# IMMEDIATE ACTION ITEMS - December 8, 2025

## 🔴 Critical Blockers (Do These First)

### 1. **Fix Nginx Proxy to Backend (5 min)**
**File:** `NGINX_PROXY_FIX_GUIDE.md`

**Problem:** nginx proxying to port 3000, but backend runs on 8080 → API fails

**Action:**
```bash
# Option 1: One-liner fix
ssh root@213.130.144.229 'sudo sed -i "s@proxy_pass http://127.0.0.1:3000/api/@proxy_pass http://127.0.0.1:8080/api/@g" /etc/nginx/sites-available/durchex.conf && sudo nginx -t && sudo systemctl reload nginx'

# Option 2: Upload and reload
scp durchex.conf root@213.130.144.229:/etc/nginx/sites-available/
ssh root@213.130.144.229 'sudo systemctl reload nginx'
```

**Verify:**
```bash
curl http://durchex.com/api/health
# Should return 200 OK (not 502 Bad Gateway)
```

---

### 2. **Rotate Exposed Credentials (30 min)**
**File:** `BACKEND_MONGO_FIX.md` → Phase 3

**Exposed Credentials Found:**
- ✅ MongoDB password: `Durchex2025..` (in `backend_temp/.env` & git history)
- ✅ Pinata API Key + Secret (in `frontend/.env`)
- ✅ Chainstack/Alchemy RPC URLs (in code & env)

**Action:** Follow the checklist in `BACKEND_MONGO_FIX.md` Phase 3

**Priority Order:**
1. MongoDB password → regenerate at https://cloud.mongodb.com
2. Pinata keys → regenerate at https://app.pinata.cloud
3. RPC keys → regenerate at Chainstack/Alchemy dashboards
4. Update .env on server
5. Clean git history (either force-push or add to .gitignore)

---

### 3. **Fix Backend Mongo Connection (10 min)**
**File:** `BACKEND_MONGO_FIX.md` → Phase 1-2

**Current Status:**
- Backend logs show: `❌ Database connection error: connect ECONNREFUSED 127.0.0.1:27017`
- Cause: MongoDB Atlas connection string OR local Mongo not running

**Action:**
```bash
# Test connection
ssh root@213.130.144.229
pm2 logs durchex-backend --lines 50 | grep -i "mongo\|database"

# If shows Atlas connection error → verify Atlas access:
# 1. https://cloud.mongodb.com → Network Access
# 2. IP whitelist includes 213.130.144.229
# 3. Password matches .env

# Restart backend
pm2 restart durchex-backend
pm2 logs durchex-backend --lines 20
```

**Expected Success:** Logs show `✅ Database connection successful!`

---

## 🟢 What's Been Done Today

### Code Changes (✅ Complete)
- ✅ **Hero.jsx** patched with mock NFT fallback
- ✅ **Explore.jsx** patched with mock NFT fallback  
- ✅ **durchex.conf** updated to proxy to 8080 (in repo)
- ✅ Documentation created (guides above)

### Result
When you complete items #1-3 above, the Explore/Hero pages will show:
- **Real NFTs** from backend (if Mongo & RPC working)
- **Mock NFTs** as fallback (if backend down)

---

## 📋 Success Criteria

```bash
# All should return 200 + actual data (or empty, not 500)
curl http://durchex.com/api/health
curl http://durchex.com/api/v1/nft/nfts/ethereum | jq . | head

# Browser: http://durchex.com
# - Should NOT show "connection refused" or "502 Bad Gateway"
# - Explore page should display NFTs
# - No RPC 401 errors in console
```

---

## 📞 Status Check Commands

```bash
ssh root@213.130.144.229

# Ports listening
ss -ltnp | grep -E ':(80|8080|27017|3000)'

# Backend status
pm2 status | grep durchex

# Recent logs
pm2 logs durchex-backend --lines 50

# nginx config test
sudo nginx -t
```

---

## 🔗 Related Files

- `NGINX_PROXY_FIX_GUIDE.md` — Detailed nginx proxy fix
- `BACKEND_MONGO_FIX.md` — Detailed Mongo connection & credential rotation
- `CREDENTIAL_ROTATION_CHECKLIST.md` — Existing checklist (reference)
- `durchex.conf` — Updated nginx config (in repo root)

---

## Next Steps After These 3 Items

1. Install SSL certificate: `sudo certbot --nginx -d durchex.com -d www.durchex.com`
2. Monitor backend logs for any remaining errors
3. Test full user flow: wallet connect → explore → buy/list
4. Set up PM2 startup script for auto-restart on server reboot
5. Configure monitoring/alerts for uptime

