# 🔧 SECURITY REMEDIATION ACTION PLAN

**Priority**: CRITICAL - Start immediately  
**Estimated Time**: 3-4 business days  
**Risk if Delayed**: Complete platform compromise possible

---

## PHASE 1: CREDENTIAL ROTATION (Do Today)

### Step 1: Rotate Pinata Credentials
1. Go to https://app.pinata.cloud/keys
2. Find and **revoke** the exposed API key `d47cf5f0335c02e37ca9`
3. Create a new API key
4. Copy the new key and secret
5. Update `frontend/.env`:
   ```env
   VITE_PINATA_API_KEY=<new_key>
   VITE_PINATA_SECRET_KEY=<new_secret>
   VITE_PINATA_JWT=<new_jwt_from_pinata>
   ```

**Status**: ⏳ Pending user action

---

### Step 2: Rotate Alchemy API Key
1. Go to https://dashboard.alchemy.com
2. Find the current API key `762nK8pWEh6o7k5yc2vyEISTGJP-tVIJ`
3. Revoke it
4. Create a new API key
5. Update `frontend/.env` - replace in all RPC URLs:
   ```env
   VITE_ALCHEMY_API_KEY=<new_key>
   
   # Update RPC endpoints with new key
   VITE_ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/<new_key>
   VITE_POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/<new_key>
   # ... etc for other networks
   ```

**Status**: ⏳ Pending user action

---

### Step 3: Change MongoDB Password
1. Go to https://cloud.mongodb.com → Network Access → Database Users
2. Find user `durchex_db_user`
3. Edit and change password to something strong (32+ characters, mixed case, numbers, symbols)
4. Update `backend_temp/.env`:
   ```env
   MONGODB_URI=mongodb+srv://durchex_db_user:<new_password>@durchex-cluster.otgf1xa.mongodb.net/?appName=durchex-cluster
   ```
5. Test connection

**Status**: ⏳ Pending user action

---

### Step 4: Rotate Chainstack API Keys
1. Go to https://console.chainstack.com
2. Find and delete old API keys
3. Generate new ones
4. Update `frontend/.env` with new keys in RPC URLs

**Status**: ⏳ Pending user action

---

## PHASE 2: GIT CLEANUP (Do Today/Tomorrow)

### Step 5: Remove .env from Git History

**Option A: Using git filter-branch (Slower but simpler)**
```bash
cd c:\Users\alexa\Documents\GitHub\Durchex_NFT_Marketplace

# Remove .env from all history
git filter-branch --force --index-filter \
  'git rm -r --cached --ignore-unmatch .env' \
  --prune-empty --tag-name-filter cat -- --all

# Remove backup refs
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

**Option B: Using BFG Repo-Cleaner (Faster for large repos)**
```bash
# Download from https://rtyley.github.io/bfg-repo-cleaner/
bfg --delete-files .env

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

**Status**: ⏳ Pending user action

---

### Step 6: Force Push to Remote
```bash
# WARNING: This rewrites history, notify team first
git push origin --force --all
git push origin --force --tags
```

**Status**: ⏳ Pending user action

---

### Step 7: Add .gitignore
Create or update `.gitignore`:
```
# Environment variables
.env
.env.local
.env.*.local
.env.development.local
.env.test.local
.env.production.local

# OS files
.DS_Store
Thumbs.db

# Dependencies
node_modules/

# Build
dist/
build/
.next/

# IDE
.vscode/
.idea/
*.swp
*.swo

# Logs
logs/
*.log
```

**Status**: ⏳ Pending user action

---

### Step 8: Create `.env.example`
Create `frontend/.env.example`:
```env
# NFT Marketplace Configuration
VITE_CONTRACT_ADDRESS=0x...
VITE_MARKETPLACE_ADDRESS=0x...

# IPFS/Pinata
VITE_PINATA_API_KEY=your_pinata_api_key_here
VITE_PINATA_SECRET_KEY=your_pinata_secret_key_here
VITE_PINATA_JWT=your_pinata_jwt_here

# RPC Endpoints
VITE_ALCHEMY_API_KEY=your_alchemy_api_key_here
VITE_ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
VITE_POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
VITE_BSC_RPC_URL=https://bsc-dataseed.bnbchain.org

# WalletConnect
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here

# API Configuration
VITE_BACKEND_URL=http://localhost:3000/api/v1
VITE_API_TIMEOUT=30000
```

Create `backend_temp/.env.example`:
```env
# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/?appName=dbname

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRATION=1h

# Server
PORT=3000
NODE_ENV=development

# Email (if applicable)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Admin Setup
ADMIN_PASSWORD=change_me_after_first_login
```

**Status**: ⏳ Pending user action

---

## PHASE 3: IMPLEMENT AUTHENTICATION (2-3 Days)

### Step 9: Create Authentication Middleware

Create `backend_temp/middleware/authenticate.js`:
```javascript
import jwt from 'jsonwebtoken';

export const authenticate = async (req, res, next) => {
  try {
    // Get token from headers
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        error: 'No authentication token provided',
        code: 'NO_TOKEN' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired', 
        code: 'TOKEN_EXPIRED' 
      });
    }
    return res.status(401).json({ 
      error: 'Invalid token', 
      code: 'INVALID_TOKEN' 
    });
  }
};
```

---

### Step 10: Create Authorization Middleware

Create `backend_temp/middleware/authorize.js`:
```javascript
export const authorize = (requiredRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!requiredRoles.includes(req.user.role)) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: requiredRoles,
          current: req.user.role
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
};
```

---

### Step 11: Create Input Validation Middleware

Create `backend_temp/middleware/validateInput.js`:
```javascript
import { body, param, validationResult } from 'express-validator';

export const validateGasFeUpdate = [
  param('network').isIn(['ethereum', 'polygon', 'bsc', 'arbitrum', 'tezos', 'hyperliquid']),
  body('minGasPrice').optional().isFloat({ min: 0 }),
  body('maxGasPrice').optional().isFloat({ min: 0 }),
  body('multiplier').optional().isFloat({ min: 0.1, max: 10 }),
  body('serviceChargeUSD').optional().isFloat({ min: 0, max: 1000 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

export const validateServiceChargeUpdate = [
  body('serviceChargeUSD').isFloat({ min: 0, max: 1000 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
```

---

### Step 12: Update Routes to Use Auth Middleware

Update `backend_temp/routes/gasFeeRouter.js`:
```javascript
import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validateGasFeUpdate, validateServiceChargeUpdate } from '../middleware/validateInput.js';
import {
  getGasFeeRegulation,
  getAllGasFeeRegulations,
  updateGasFeeRegulation,
  calculateRegulatedGasPrice,
  getGlobalServiceCharge,
  updateGlobalServiceCharge,
  toggleGlobalServiceCharge,
} from '../controllers/gasFeeController.js';

const router = express.Router();

// Public routes
router.get('/network/:network', getGasFeeRegulation);
router.get('/all', getAllGasFeeRegulations);
router.post('/calculate', calculateRegulatedGasPrice);

// Admin routes - require authentication AND admin role
router.get('/admin/global', 
  authenticate, 
  authorize(['admin']), 
  getGlobalServiceCharge);

router.put('/admin/global', 
  authenticate, 
  authorize(['admin']), 
  validateServiceChargeUpdate,
  updateGlobalServiceCharge);

router.patch('/admin/global/toggle', 
  authenticate, 
  authorize(['admin']), 
  toggleGlobalServiceCharge);

router.put('/admin/:network', 
  authenticate, 
  authorize(['admin']), 
  validateGasFeUpdate,
  updateGasFeeRegulation);

export default router;
```

---

### Step 13: Update User Routes with Auth

Update `backend_temp/routes/userRouter.js`:
```javascript
import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import {
  createOrUpdateUserProfile,
  getAllUsers,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
} from '../controllers/userController.js';

const router = express.Router();

// Public routes
router.post("/users", createOrUpdateUserProfile);
router.get("/users/:walletAddress", getUserProfile);

// Protected routes
router.get("/users", 
  authenticate, 
  authorize(['admin']), 
  getAllUsers);

router.put("/users/:walletAddress", 
  authenticate, 
  // User can only update their own profile
  (req, res, next) => {
    if (req.user.walletAddress !== req.params.walletAddress && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Cannot update other users' });
    }
    next();
  },
  updateUserProfile);

router.delete("/users/:walletAddress", 
  authenticate, 
  authorize(['admin']), 
  deleteUserProfile);

export default router;
```

---

## PHASE 4: SECURITY HARDENING (1-2 Days)

### Step 14: Add Security Headers & Rate Limiting

Update `backend_temp/server.js`:
```javascript
import express from "express";
import morgan from "morgan";
import cors from "cors";
import bodyParse from "body-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from "./config/db.js";

const app = express();

// Security Middleware
app.use(helmet()); // Adds security headers

// CORS - Whitelist trusted origins
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes
  skipSuccessfulRequests: true
});

app.use('/api/', generalLimiter);
app.use('/api/v1/admin-auth', authLimiter);

// Rest of server setup...
```

---

### Step 15: Run Dependency Audits

```bash
# Frontend audit
cd frontend
npm audit

# If critical vulnerabilities
npm audit fix

# Backend audit
cd ../backend_temp
npm audit
npm audit fix
```

---

## PHASE 5: VERIFICATION (1 Day)

### Step 16: Test Authentication
- ✅ Verify old credentials no longer work
- ✅ Test protected endpoints reject unauthenticated requests
- ✅ Test protected endpoints reject unauthorized roles
- ✅ Test token expiration

### Step 17: Test Authorization
- ✅ User can only modify their own profile
- ✅ Only admins can access `/admin/*` endpoints
- ✅ Input validation prevents invalid data

### Step 18: Security Headers Check
```bash
curl -i http://localhost:3000/
# Should see X-Frame-Options, X-Content-Type-Options, etc.
```

---

## TIMELINE

| Phase | Task | Days | Status |
|-------|------|------|--------|
| 1 | Credential Rotation | 1 | ⏳ Pending |
| 2 | Git Cleanup | 1 | ⏳ Pending |
| 3 | Auth Middleware | 2-3 | ⏳ Pending |
| 4 | Security Hardening | 1-2 | ⏳ Pending |
| 5 | Verification | 1 | ⏳ Pending |
| | **TOTAL** | **5-7 days** | ⏳ Pending |

---

## FILES TO BE CREATED

1. `backend_temp/middleware/authenticate.js`
2. `backend_temp/middleware/authorize.js`
3. `backend_temp/middleware/validateInput.js`
4. `frontend/.env.example`
5. `backend_temp/.env.example`
6. `.gitignore` (update)
7. `SECURITY_REMEDIATION_COMPLETED.md` (after completion)

---

## VERIFICATION CHECKLIST

- [ ] All .env files removed from git history
- [ ] New .env.example files in git
- [ ] Credentials rotated (Pinata, Alchemy, MongoDB, Chainstack)
- [ ] Authentication middleware implemented
- [ ] Authorization middleware implemented
- [ ] Input validation middleware implemented
- [ ] All admin routes protected with auth + auth
- [ ] User can only modify own profile
- [ ] CORS whitelist set correctly
- [ ] Security headers added (helmet)
- [ ] Rate limiting enabled
- [ ] npm audit clean (no critical vulnerabilities)
- [ ] Routes tested and working
- [ ] Staging deployment verified
- [ ] Production deployment completed

---

## NEXT STEPS

**Waiting for user confirmation to proceed with implementation:**
1. Confirm credentials have been rotated
2. Confirm .env files removed from git
3. I will implement all middleware and security fixes
4. Deploy to staging for testing
5. Deploy to production

**Type "CONFIRM" to proceed with implementation.**
