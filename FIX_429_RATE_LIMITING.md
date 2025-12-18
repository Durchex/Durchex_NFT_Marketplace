# Fix 429 (Too Many Requests) Rate Limiting Errors

## Problem Analysis

You're seeing **429 (Too Many Requests)** errors from `https://durchex.com/api/v1/cart/cart/0x55acfdc…`

This means:
- ✅ **Test suite is working** (local tests passed)
- ❌ **Frontend is rate-limited** (too many requests from your IP)
- The backend has rate limiting enabled

## Root Causes

1. **Too many rapid requests** from frontend JavaScript
2. **Browser caching issues** causing duplicate requests
3. **IP-based rate limiting** from Cloudflare or backend
4. **Multiple browser tabs** making requests simultaneously
5. **Development mode** making excessive API calls

---

## Solutions

### Solution 1: Clear Browser Cache & Local Storage

```javascript
// Open browser DevTools console and run:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

Or:
1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Clear site data**
4. Check "Cookies" and "Cached images/files"
5. Reload page

### Solution 2: Wait for Rate Limit to Reset

Rate limits typically reset after **15-60 minutes** of no requests.

```bash
# Don't make any API requests for 15-60 minutes
# Then try again
```

### Solution 3: Reduce Request Frequency

**In your frontend code (wherever you fetch cart):**

```javascript
// BEFORE: Makes requests too frequently
cart.addEventListener('click', () => {
  getUserCart();  // Fires on every click
});

// AFTER: Add debouncing
import { debounce } from 'lodash';

const fetchCartDebounced = debounce(() => {
  getUserCart();
}, 1000);  // Wait 1 second before fetching

cart.addEventListener('click', fetchCartDebounced);
```

### Solution 4: Implement Retry Logic with Backoff

**In your API client:**

```javascript
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;  // Start with 1 second

async function apiCallWithRetry(url, options, attempt = 0) {
  try {
    const response = await fetch(url, options);
    
    // Handle 429
    if (response.status === 429) {
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY * Math.pow(2, attempt);
        console.log(`Rate limited. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return apiCallWithRetry(url, options, attempt + 1);
      }
      throw new Error('Max retries exceeded');
    }
    
    return response;
  } catch (error) {
    console.error(`API call failed: ${error.message}`);
    throw error;
  }
}
```

### Solution 5: Check Backend Rate Limiting Config

**If you have access to backend (.env or config):**

```env
# Increase rate limit (if using express-rate-limit)
RATE_LIMIT_WINDOW_MS=900000        # 15 minutes
RATE_LIMIT_MAX_REQUESTS=1000       # requests per window

# Or disable for development
RATE_LIMIT_ENABLED=false           # Only in dev!
```

### Solution 6: Use Local Development Environment

**Switch to localhost instead of production:**

```javascript
// In your frontend config:
const API_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3000'           // Local backend
  : 'https://durchex.com';             // Production

// Or set in .env
REACT_APP_API_URL=http://localhost:3000
```

### Solution 7: Check Cloudflare Rate Limiting

If using Cloudflare, you might be hitting their rate limits:

1. Go to Cloudflare Dashboard
2. Navigate to **Rate Limiting Rules**
3. Check if `durchex.com` has rules active
4. Whitelist your IP or adjust thresholds
5. Or disable for development

---

## Quick Fixes (Try These First)

### Fix #1: Restart Everything
```bash
# 1. Clear browser cache
# Open DevTools (F12) → Application → Clear site data

# 2. Restart your backend
npm run dev          # or your start command

# 3. Refresh browser
# Ctrl+Shift+R (hard refresh)
```

### Fix #2: Use Incognito/Private Mode
```
Browser → Open New Incognito/Private Window
Go to https://durchex.com
Test cart functionality
```

**Why:** Bypasses all local cache and cookies

### Fix #3: Switch to Localhost
```
# If you have backend running locally:
Change API URL from: https://durchex.com
To: http://localhost:3000

# In code or .env file
```

---

## Verification Steps

After applying a fix, verify it works:

```javascript
// In browser console:

// Check 1: Clear cache
localStorage.clear();
sessionStorage.clear();

// Check 2: Make test request
fetch('https://durchex.com/api/v1/user/users', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  }
})
.then(r => r.json())
.then(d => console.log('✅ Success:', d))
.catch(e => console.log('❌ Error:', e));

// Should return 200, not 429
```

---

## Prevention for Development

### Update Your Development Setup

**Create a `.env.development` file:**

```env
# Use local backend in development
REACT_APP_API_URL=http://localhost:3000

# Disable rate limiting for dev
RATE_LIMIT_ENABLED=false

# Longer timeouts
REACT_APP_API_TIMEOUT=60000

# Enable request batching
REACT_APP_REQUEST_BATCHING=true
```

**Update your API client:**

```javascript
// api.js or similar
const isDev = process.env.NODE_ENV === 'development';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 30000,
  
  // Add request deduplication
  headers: {
    'X-Request-ID': generateUUID(),
  }
});

// Add request deduplication middleware
const requestCache = new Map();

apiClient.interceptors.request.use(config => {
  const cacheKey = `${config.method}:${config.url}`;
  
  if (requestCache.has(cacheKey)) {
    // Return cached promise if request made within 1 second
    const cached = requestCache.get(cacheKey);
    if (Date.now() - cached.timestamp < 1000) {
      return cached.promise;
    }
  }
  
  requestCache.set(cacheKey, {
    timestamp: Date.now(),
    promise: config
  });
  
  return config;
});
```

---

## For Production Deployment

### Recommended Rate Limiting Strategy

```javascript
// backend/middleware/rateLimit.js
import rateLimit from 'express-rate-limit';

// Stricter for sensitive endpoints
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window
  message: 'Too many requests, please try again later'
});

// Generous for public endpoints
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests'
});

export { strictLimiter, publicLimiter };

// Usage
app.get('/api/v1/cart/cart/:wallet', publicLimiter, getCart);
app.post('/api/v1/admin/ban-user', strictLimiter, banUser);
```

---

## Troubleshooting Checklist

- [ ] Cleared browser cache and local storage
- [ ] Used incognito/private mode to test
- [ ] Waited 15+ minutes before retrying
- [ ] Switched to local backend (http://localhost:3000)
- [ ] Checked `.env` file for correct API URL
- [ ] Implemented retry logic with backoff
- [ ] Added request deduplication
- [ ] Checked Cloudflare rate limiting rules
- [ ] Restarted backend server
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Checked backend logs for rate limit details
- [ ] Checked server IP whitelist settings

---

## Test Suite Status

**Good news:** ✅ Your automated test suite works perfectly!

```
✅ All 38 tests passed locally
✅ Core features working
✅ Giveaway system working  
✅ Payment system working
✅ Admin functions working
✅ Security tests passing
```

The 429 errors are isolated to the **frontend browser** hitting the production API, not your test suite.

---

## Next Steps

1. **Apply one of the quick fixes above** (try Fix #1 first)
2. **Test in incognito mode** to isolate cache issues
3. **Use local backend** if you have it running
4. **Wait if needed** (rate limits reset after 15 minutes)
5. **Implement prevention** for your development workflow

---

## Resources

- [Express Rate Limit Documentation](https://github.com/nfriedly/express-rate-limit)
- [Cloudflare Rate Limiting](https://developers.cloudflare.com/waf/rate-limiting-rules/)
- [MDN: HTTP 429 Status](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429)
- [Exponential Backoff Strategy](https://en.wikipedia.org/wiki/Exponential_backoff)

---

**Created:** December 17, 2025  
**Status:** Solution Guide  
**Priority:** 🟡 Medium (Development only, not critical for deployment)
