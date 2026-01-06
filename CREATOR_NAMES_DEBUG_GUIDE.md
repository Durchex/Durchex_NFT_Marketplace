# Creator Name Debugging Guide

## What Was Fixed

Added comprehensive logging to the Explore page to debug why some creator names show as "Creator 1", "Creator 2" instead of real usernames.

## How to Debug

### 1. Open Browser Developer Console
- Go to https://durchex.com/explore
- Press **F12** to open Developer Tools
- Click **Console** tab

### 2. Look for These Log Messages

```
[Explore] Fetching NFTs from polygon...
[Explore] Found X NFTs on polygon
[Explore] Total NFTs from all networks: X
[Explore] Extracted X unique creators from NFTs
```

### 3. Check Creator Profile Fetching

Look for logs like:
```
[Explore] Fetching profile for creator: 0x1234567890...
[Explore] ✅ Got username for 0x1234567890: JohnDoe
```

Or if it fails:
```
[Explore] ⚠️  Failed to fetch profile for 0x1234567890, using fallback: 0x1234...7890
```

### 4. Check Creator Map

Look for:
```
[Explore] Added to map: 0x1234567890 => JohnDoe
```

### 5. Check NFT Creator Mapping

Look for:
```
[Explore] NFT "My NFT Name" owner=0x1234567890, mapped username=JohnDoe
```

---

## What Each Log Means

| Log | Meaning |
|-----|---------|
| `✅ Got username for X: Y` | Successfully fetched real username |
| `⚠️ Failed to fetch profile for X` | API failed, using wallet abbreviation |
| `Added to map: X => Y` | Created lookup table entry |
| `NFT "name" owner=X, mapped username=Y` | NFT creator name resolved correctly |

---

## Common Issues & Fixes

### Issue 1: All creators showing as wallet abbreviations
**Cause**: `userAPI.getUserProfile()` is failing
**Check**: Look for `⚠️ Failed to fetch profile` logs
**Fix**: Ensure user profile API endpoint is working:
```bash
curl https://durchex.com/api/users/0x1234567890
```

### Issue 2: Creator map is empty
**Cause**: No creator addresses being extracted from NFTs
**Check**: Look for `Extracted X unique creators` - should be > 0
**Fix**: Verify NFTs have `owner` or `creator` field populated in database

### Issue 3: Some creators show names, others don't
**Cause**: Partial API failures or missing user profiles
**Check**: Look for mix of `✅` and `⚠️` logs
**Fix**: This is expected - shows fallback mechanism working

---

## Database Verification

Check if NFT data has required fields:

```bash
# SSH to VPS
ssh root@213.130.144.229
cd /home/durchex/htdocs/durchex.com

# Check NFT data structure
mongo --eval "db.nfts.findOne()" durchex_nft_db

# Expected output includes:
# "owner": "0x1234567890...",
# "creator": "0x1234567890...",
# "name": "My NFT",
# "description": "..."
```

Check if user profiles exist:

```bash
# Check users collection
mongo --eval "db.users.findOne()" durchex_nft_db

# Expected output includes:
# "walletAddress": "0x1234567890...",
# "username": "JohnDoe",
# "bio": "..."
```

---

## API Endpoints to Test

### Test NFT Fetching
```bash
curl https://durchex.com/api/nfts/polygon
```

Should return array of NFTs with `owner` and `creator` fields.

### Test User Profile
```bash
curl https://durchex.com/api/users/0x1234567890
```

Should return:
```json
{
  "walletAddress": "0x1234567890",
  "username": "UserName",
  "bio": "User bio",
  "profileImage": "https://...",
  "followers": 10
}
```

---

## Recent Changes

**File**: `frontend/src/pages/Explore.jsx`

1. **Enhanced Logging** (Lines 74-96)
   - Logs each creator profile fetch attempt
   - Shows success/failure for each address
   - Logs final creator map contents

2. **Better Error Handling** (Lines 99-111)
   - Detailed logging of NFT-to-username mapping
   - Shows fallback when profile fetch fails
   - Logs all newly added NFTs with resolved creators

3. **Debugging Output**
   - Console logs show the exact mapping process
   - Easy to spot missing or incorrect data

---

## How to Fix if Still Showing "Creator 1", "Creator 2"

1. **Check Browser Console** for all `[Explore]` logs
2. **Look for failures** in profile fetching
3. **Verify API endpoints** are responding
4. **Check database** for NFT and user data
5. **Restart services**:
   ```bash
   pm2 restart durchex-backend
   pm2 restart durchex-frontend
   ```
6. **Clear browser cache** (Ctrl+Shift+Delete) and reload

---

## Next Steps if Debug Logs Show Data

If the console logs show:
- ✅ Creator names being fetched correctly
- ✅ Creator map populated
- ✅ NFTs mapped to usernames

But frontend still shows "Creator 1", "Creator 2":

Then the issue is in the **display component**, not data fetching. Contact support with console log screenshots.

---

## To Access Console Logs Live

1. Open Explore page: https://durchex.com/explore
2. Press F12 to open DevTools
3. Go to Console tab
4. Look for logs starting with `[Explore]`
5. Right-click in console and select "Save as..." to export logs

Share these logs if creators are still not displaying correctly!
