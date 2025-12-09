# 🔐 CREDENTIAL ROTATION CHECKLIST

**CRITICAL**: Complete ALL items before continuing with implementation

---

## EXPOSED CREDENTIALS TO ROTATE

### 1. Pinata (IPFS Provider)
- [ ] **Status**: Need to rotate
- [ ] **Exposed Key**: `d47cf5f0335c02e37ca9`
- [ ] **Exposed Secret**: `ad53fc80c198738b89bc1d4e91b85a78fa1f0c9903aa936c5eaceec0f6ce39bd`
- [ ] **Exposed JWT**: Full token in `frontend/.env`

**Action**:
1. Go to https://app.pinata.cloud/keys
2. Click the exposed key → **Revoke**
3. Create new API key
4. Note down: New API Key, New Secret Key, New JWT
5. Update `frontend/.env`:
   ```env
   VITE_PINATA_API_KEY=<new_key>
   VITE_PINATA_SECRET_KEY=<new_secret>
   VITE_PINATA_JWT=<new_jwt>
   ```
6. Test by uploading a test file to Pinata

- [ ] **Completed**: Date ___________

---

### 2. Alchemy (RPC Provider)
- [ ] **Status**: Need to rotate
- [ ] **Exposed Key**: `762nK8pWEh6o7k5yc2vyEISTGJP-tVIJ`
- [ ] **Used in**: 5+ RPC URLs (Ethereum, Polygon, BSC, Arbitrum, etc.)

**Action**:
1. Go to https://dashboard.alchemy.com/apps
2. Find current API key
3. Click it → **Edit** → **Revoke**
4. Create new API key
5. Update `frontend/.env` - replace in ALL RPC URLs:
   ```env
   VITE_ALCHEMY_API_KEY=<new_key>
   VITE_ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/<new_key>
   VITE_POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/<new_key>
   VITE_BSC_RPC_URL=https://bsc-dataseed.bnbchain.org
   VITE_ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/<new_key>
   # ... etc for all networks
   ```
6. Test by making a simple RPC call to each network

- [ ] **Completed**: Date ___________

---

### 3. MongoDB (Database)
- [ ] **Status**: Need to rotate
- [ ] **Exposed Password**: `Durchex2025..`
- [ ] **Connection String**: `mongodb+srv://durchex_db_user:Durchex2025..@durchex-cluster.otgf1xa.mongodb.net/?appName=durchex-cluster`

**Action**:
1. Go to https://cloud.mongodb.com
2. Select **Cluster** → **Security** → **Database Access**
3. Find user `durchex_db_user`
4. Click **Edit** → **Generate Password** (or use custom password)
5. Use NEW strong password (32+ chars, mixed case, numbers, symbols)
   - Example: `Durchex2025!@#$%^&*xYzAb123456`
6. Update `backend_temp/.env`:
   ```env
   MONGODB_URI=mongodb+srv://durchex_db_user:<new_password>@durchex-cluster.otgf1xa.mongodb.net/?appName=durchex-cluster
   ```
7. Test connection with `node backend_temp/test-mongodb-connection.js`

- [ ] **Completed**: Date ___________

---

### 4. Chainstack (RPC Provider - Alternative)
- [ ] **Status**: Need to check
- [ ] **Check if used**: Look in `frontend/.env` for Chainstack endpoints
- [ ] **If found, rotate**: ✅ or ❌

**Action (if using Chainstack)**:
1. Go to https://console.chainstack.com
2. Find and delete old endpoints
3. Create new endpoints
4. Update `frontend/.env` with new endpoints

- [ ] **Completed**: Date ___________

---

### 5. WalletConnect
- [ ] **Status**: Check if Project ID is exposed
- [ ] **Required Field**: `VITE_WALLETCONNECT_PROJECT_ID`

**Action**:
1. Check `frontend/.env` - is there a WalletConnect Project ID?
2. If YES, visit https://cloud.walletconnect.com
3. If exposed, create new project/app
4. Update `frontend/.env` with new Project ID
5. If NO Project ID exists yet, create one at https://cloud.walletconnect.com

- [ ] **Completed**: Date ___________

---

## GIT HISTORY CLEANUP

- [ ] **Remove .env files from git history**:
  ```bash
  # Using git filter-branch (simple)
  git filter-branch --force --index-filter \
  'git rm -r --cached --ignore-unmatch .env' \
  --prune-empty --tag-name-filter cat -- --all
  
  # Clean up
  git reflog expire --expire=now --all
  git gc --prune=now --aggressive
  ```

  OR

  ```bash
  # Using BFG Repo-Cleaner (faster)
  bfg --delete-files .env
  git reflog expire --expire=now --all
  git gc --prune=now --aggressive
  ```

- [ ] **Force push to remote** (WARNING: notifies all contributors):
  ```bash
  git push origin --force --all
  git push origin --force --tags
  ```

- [ ] **Add .gitignore**:
  Create `.gitignore` with:
  ```
  .env
  .env.local
  .env.*.local
  ```

- [ ] **Completed**: Date ___________

---

## VERIFICATION

- [ ] Old Pinata key no longer works (test in Pinata dashboard)
- [ ] Old Alchemy key no longer works (test by calling RPC)
- [ ] Old MongoDB password fails (test with wrong password)
- [ ] New credentials work in frontend `.env`
- [ ] New credentials work in backend_temp `.env`
- [ ] `.env` no longer in git (check with `git log --all --full-history -- .env`)
- [ ] `.env.example` created with placeholder values
- [ ] Git history clean (old credentials not recoverable)

---

## MONITORING

After rotation, monitor for:
- [ ] Unexpected API calls to Pinata (admin panel)
- [ ] Unusual RPC usage on Alchemy (dashboard)
- [ ] MongoDB login attempts from unknown IPs (Atlas dashboard)
- [ ] Application errors due to wrong credentials (app logs)

---

## RISK ASSESSMENT

**If you skip this:**
- 🔴 **Critical**: Attackers can upload malicious NFT metadata
- 🔴 **Critical**: Attackers can access/modify entire database
- 🔴 **Critical**: Your API quota can be exhausted
- 🔴 **Critical**: User data and funds at immediate risk

**Estimated time to complete**: **1-2 hours**

---

## SIGN OFF

- [ ] User confirms all credentials rotated
- [ ] User confirms git history cleaned
- [ ] User confirms new .env tested
- [ ] User ready for implementation: **YES / NO**

**Please complete all items and reply "COMPLETE" when done.**
