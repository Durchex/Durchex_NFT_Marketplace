# VPS Backend Debugging Guide

## Quick Start

1. **Connect to your VPS:**
   ```bash
   ssh root@213.130.144.229
   ```

2. **Upload and run the debugging script:**
   ```bash
   # After connecting, navigate to your project directory
   cd /home/durchex/htdocs/durchex.com
   # OR
   cd /root/durchex
   
   # Run the debugging script
   bash DEBUG_BACKEND_VPS.sh
   ```

## Manual Debugging Steps

### Step 1: Check if Backend is Running

```bash
# Check PM2 processes
pm2 list

# Check if port 3000 is in use
lsof -i :3000
# OR
netstat -tlnp | grep :3000
# OR
ss -tlnp | grep :3000

# Test backend directly
curl http://localhost:3000/api/health
```

### Step 2: Check Backend Logs

```bash
# PM2 logs
pm2 logs durchex-backend --lines 50

# Or if using different process name
pm2 logs --lines 50

# Check for error logs in project directory
tail -f /home/durchex/htdocs/durchex.com/backend_temp/logs/*.log
```

### Step 3: Check Nginx Status

```bash
# Check Nginx status
systemctl status nginx

# Check Nginx error logs
tail -f /var/log/nginx/error.log

# Test Nginx configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

### Step 4: Start/Restart Backend

```bash
# Navigate to backend directory
cd /home/durchex/htdocs/durchex.com/backend_temp
# OR
cd /root/durchex/backend_temp

# Start with PM2
pm2 start ecosystem.config.cjs

# Or restart if already running
pm2 restart durchex-backend

# Or if using npm
npm start
```

## Common Issues and Solutions

### Issue 1: Backend Not Running

**Symptoms:** 502 Bad Gateway, port 3000 not in use

**Solution:**
```bash
cd /home/durchex/htdocs/durchex.com/backend_temp
pm2 start ecosystem.config.cjs
pm2 save  # Save PM2 process list
```

### Issue 2: Backend Crashed

**Symptoms:** Process exists but not responding

**Solution:**
```bash
# Check logs for errors
pm2 logs durchex-backend --lines 100

# Restart the process
pm2 restart durchex-backend

# If it keeps crashing, check:
# - Database connection
# - Environment variables
# - Port conflicts
```

### Issue 3: Nginx Can't Connect to Backend

**Symptoms:** 502 Bad Gateway, backend running but Nginx can't reach it

**Solution:**
```bash
# Verify backend is accessible
curl http://localhost:3000/api/health

# Check Nginx config
cat /etc/nginx/sites-available/durchex.com | grep -A 5 "location /api/"

# Should have: proxy_pass http://localhost:3000/api/;

# Reload Nginx
systemctl reload nginx
```

### Issue 4: Database Connection Issues

**Symptoms:** Backend starts but API calls fail

**Solution:**
```bash
# Check MongoDB status
systemctl status mongod

# Check backend .env file
cat /home/durchex/htdocs/durchex.com/backend_temp/.env | grep MONGO

# Test MongoDB connection
mongo --eval "db.adminCommand('ping')"
```

## Quick Fix Commands

```bash
# Complete restart sequence
cd /home/durchex/htdocs/durchex.com/backend_temp
pm2 stop durchex-backend
pm2 delete durchex-backend
pm2 start ecosystem.config.cjs
pm2 save
systemctl reload nginx

# Check everything is working
pm2 list
curl http://localhost:3000/api/health
curl http://localhost/api/v1/nft/nfts/arbitrum
```

## Finding Your Backend Directory

The backend might be in one of these locations:

```bash
# Check common locations
ls -la /home/durchex/htdocs/durchex.com/
ls -la /root/durchex/
ls -la /var/www/durchex/

# Find server.js file
find /home -name "server.js" -type f 2>/dev/null
find /root -name "server.js" -type f 2>/dev/null
```

## Environment Variables

Make sure your `.env` file has all required variables:

```bash
cd /home/durchex/htdocs/durchex.com/backend_temp
cat .env

# Should include:
# - MONGO_URI
# - PORT=3000
# - NODE_ENV=production
# - JWT_SECRET
# - etc.
```

## Monitoring

```bash
# Monitor backend in real-time
pm2 monit

# Watch logs
pm2 logs durchex-backend

# Check system resources
htop
# OR
top
```

## If All Else Fails

1. **Check system logs:**
   ```bash
   journalctl -u nginx -n 50
   dmesg | tail -20
   ```

2. **Verify firewall:**
   ```bash
   iptables -L -n | grep 3000
   ufw status
   ```

3. **Check disk space:**
   ```bash
   df -h
   ```

4. **Check memory:**
   ```bash
   free -h
   ```
