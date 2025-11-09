# How to Run the Nginx Fix Script

## Quick Start

1. **Copy the script to your server:**
   ```bash
   # From your local machine, copy to server:
   scp FIX_NGINX_PROXY.sh user@your-server:/tmp/
   ```

2. **SSH into your server:**
   ```bash
   ssh user@your-server
   ```

3. **Make the script executable:**
   ```bash
   chmod +x /tmp/FIX_NGINX_PROXY.sh
   ```

4. **Run the script:**
   ```bash
   sudo bash /tmp/FIX_NGINX_PROXY.sh
   ```

## What the Script Does

1. ✅ Finds your Nginx config file at `/home/durchex/htdocs/durchex.com/nginx.conf`
2. ✅ Creates a backup before making changes
3. ✅ Updates `proxy_pass http://localhost:3000;` to `proxy_pass http://localhost:3000/api/;`
4. ✅ Tests the Nginx configuration
5. ✅ Reloads Nginx if the test passes
6. ✅ Verifies the backend is running

## Expected Output

```
=== Durchex Nginx Proxy Fix ===

✅ Found config file: /home/durchex/htdocs/durchex.com/nginx.conf
✅ Found location /api/ block
Current proxy_pass:     proxy_pass http://localhost:3000;
✅ Created backup: /home/durchex/htdocs/durchex.com/nginx.conf.backup.20250129_123456
✅ Updated proxy_pass to: proxy_pass http://localhost:3000/api/;
New proxy_pass:         proxy_pass http://localhost:3000/api/;

=== Testing Nginx Configuration ===
✅ Nginx configuration is valid

=== Reloading Nginx ===
✅ Nginx reloaded successfully

=== Testing API Endpoint ===
✅ Backend is responding on port 3000

=== Done ===
Test the API: curl -I https://durchex.com/api/v1/admin/stats
```

## If the Script Fails

### Script can't find the config file?
- Update line 10 in `FIX_NGINX_PROXY.sh` with the correct path
- Or run: `find /home -name "nginx.conf" -path "*durchex*"` to find it

### Nginx test fails?
- Check the error message: `sudo nginx -t`
- Restore backup: `cp /home/durchex/htdocs/durchex.com/nginx.conf.backup.* /home/durchex/htdocs/durchex.com/nginx.conf`

### Backend not responding?
- Check if backend is running: `pm2 list` or `ps aux | grep node`
- Test directly: `curl http://localhost:3000/api/health`

## Manual Alternative

If the script doesn't work, see `QUICK_NGINX_FIX.md` for manual step-by-step instructions.

## After Running

1. **Refresh your browser** (hard refresh: `Ctrl+Shift+R`)
2. **Check browser console** - should see `200` or `401` (not `404`)
3. **Test admin dashboard** - should load data successfully

## Verification

After the fix, test with:
```bash
curl -I https://durchex.com/api/v1/admin/stats
```

Should return:
- `200 OK` (if authenticated)
- `401 Unauthorized` (if not authenticated)
- NOT `404 Not Found`

