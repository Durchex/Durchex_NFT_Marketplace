# VPS Deployment - Quick Reference Card

---

## 🚀 FASTEST WAY TO DEPLOY (5 minutes)

### On Your VPS (as root):
```bash
# 1. Clone and run deployment script
cd /tmp
git clone https://github.com/YOUR_USERNAME/Durchex_NFT_Marketplace.git
cd Durchex_NFT_Marketplace
sudo bash vps-deploy.sh durchex.com https://github.com/YOUR_USERNAME/Durchex_NFT_Marketplace.git

# 2. Edit backend environment variables
nano /home/durchex/htdocs/durchex.com/backend_temp/.env
# Update: MONGO_URI, JWT_SECRET, contract addresses

# 3. Restart backend
pm2 restart durchex-backend

# 4. Verify
curl https://durchex.com/api/v1/health
```

Done! Your site is live at `https://durchex.com`

---

## 📋 MANUAL DEPLOYMENT (if script fails)

### Prerequisites Check
```bash
sudo apt update && sudo apt upgrade -y
node --version          # Should be v18+
npm --version          # Should be 8+
nginx -v              # Should show Nginx version
pm2 --version         # Should show version
```

### Setup Directories
```bash
sudo mkdir -p /home/durchex/htdocs
sudo chown -R $USER:$USER /home/durchex
cd /home/durchex/htdocs
git clone <repo-url> durchex.com
cd durchex.com
```

### Setup Backend
```bash
cd backend_temp
# Copy your .env (with MongoDB URI and keys)
cp .env.example .env
# Edit .env with real values
nano .env
npm install
```

### Setup Frontend
```bash
cd ../frontend
npm install
npm run build
ls -la dist/  # Verify build exists
```

### Configure Nginx
```bash
# Create config
sudo nano /etc/nginx/sites-available/durchex.com
# Paste config from VPS_DEPLOYMENT_STEPS.md

# Enable
sudo ln -sf /etc/nginx/sites-available/durchex.com /etc/nginx/sites-enabled/

# Test
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

### Setup SSL
```bash
sudo certbot certonly --nginx -d durchex.com -d www.durchex.com
```

### Start Backend
```bash
cd /home/durchex/htdocs/durchex.com/backend_temp
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

### Verify
```bash
pm2 status
curl http://localhost:3000/api/health
curl https://durchex.com/api/v1/health
```

---

## 🔧 COMMON TASKS

### View Logs
```bash
pm2 logs durchex-backend              # Backend logs
sudo tail -f /var/log/nginx/error.log # Nginx errors
pm2 monit                             # Real-time monitoring
```

### Restart Services
```bash
pm2 restart durchex-backend           # Restart backend
pm2 restart all                       # Restart all
sudo systemctl reload nginx           # Reload Nginx
sudo systemctl restart nginx          # Restart Nginx
```

### Check Status
```bash
pm2 status                            # Process status
pm2 info durchex-backend              # Detailed info
sudo systemctl status nginx           # Nginx status
curl http://localhost:3000/api/health # Backend health
```

### Stop/Start
```bash
pm2 stop durchex-backend              # Stop backend
pm2 start durchex-backend             # Start backend
pm2 delete durchex-backend            # Remove from PM2
```

---

## ⚠️ TROUBLESHOOTING

### 502 Bad Gateway
```bash
# Check backend running
pm2 status

# Check listening on port 3000
lsof -i :3000

# Check backend logs
pm2 logs durchex-backend

# Restart
pm2 restart durchex-backend
sudo systemctl reload nginx
```

### SSL Certificate Issues
```bash
# Check cert status
sudo certbot certificates

# Renew manually
sudo certbot renew --force-renewal

# Check auto-renewal
sudo systemctl status certbot.timer
```

### Frontend Not Loading
```bash
# Check files exist
ls /home/durchex/htdocs/durchex.com/frontend/dist/index.html

# Check Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Check permissions
sudo chown -R $USER:$USER /home/durchex
```

### Out of Memory
```bash
# Check memory
free -h
top

# Restart backend
pm2 restart durchex-backend

# View PM2 memory config
pm2 info durchex-backend | grep memory
```

---

## 📊 HEALTH CHECK COMMANDS

```bash
# All at once
echo "Nginx: $(sudo systemctl is-active nginx)" && \
echo "Backend: $(lsof -i :3000 | tail -1 | awk '{print $NF}')" && \
echo "Database: $(curl -s http://localhost:3000/api/health | grep -q 'ok' && echo 'OK' || echo 'ERROR')" && \
echo "SSL: $(sudo certbot certificates | grep 'durchex.com')"
```

---

## 📁 KEY DIRECTORIES

```
/home/durchex/htdocs/durchex.com/
├── backend_temp/
│   ├── .env (production secrets)
│   ├── server.js
│   └── ecosystem.config.js
├── frontend/
│   ├── dist/ (built files served by Nginx)
│   └── public/
└── contracts/
    └── *.sol (smart contracts)

/etc/nginx/sites-available/
└── durchex.com (Nginx config)

/var/log/nginx/
├── durchex-access.log
└── durchex-error.log

/var/log/pm2/
├── durchex-backend-*.log
└── durchex-indexer-*.log
```

---

## 🔑 IMPORTANT CONFIGURATION FILES

### Backend .env (backend_temp/.env)
```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=your_secret_key_here_at_least_32_chars
ETHEREUM_RPC_URL=your_rpc_endpoint
LAZY_MINT_CONTRACT_ADDRESS=0x...
```

### Nginx Config (/etc/nginx/sites-available/durchex.com)
```
- SSL certificates path
- Root directory for frontend files
- API proxy to localhost:3000
- Gzip compression
- Cache headers
```

### PM2 Config (backend_temp/ecosystem.config.js)
```
- App name: durchex-backend
- Script: ./server.js
- Instances: max (cluster mode)
- Port: 3000
- Auto-restart on crash
```

---

## 📞 QUICK COMMANDS

| Task | Command |
|------|---------|
| Deploy | `sudo bash vps-deploy.sh` |
| View logs | `pm2 logs durchex-backend` |
| Restart | `pm2 restart durchex-backend` |
| Stop | `pm2 stop durchex-backend` |
| Status | `pm2 status` |
| Reload Nginx | `sudo systemctl reload nginx` |
| Test Nginx | `sudo nginx -t` |
| View cert | `sudo certbot certificates` |
| SSH ports | `lsof -i -n -P` |
| Disk usage | `df -h` |
| Memory | `free -h` |

---

## 🆘 SUPPORT DOCS

- **Full Guide**: `VPS_DEPLOYMENT_STEPS.md` (50+ sections)
- **Nginx Debug**: `DIAGNOSE_NGINX_BACKEND.sh`
- **Backend Debug**: `DEBUG_BACKEND_VPS.sh`
- **Backend Guide**: `BACKEND_DEPLOYMENT_GUIDE.md`
- **Frontend Guide**: `FRONTEND_DEPLOYMENT_GUIDE.md`

---

## ☑️ PRE-DEPLOYMENT CHECKLIST

- [ ] VPS IP configured
- [ ] Domain DNS pointing to VPS
- [ ] MongoDB Atlas credentials ready
- [ ] Smart contracts deployed
- [ ] Backend .env prepared
- [ ] Frontend .env prepared
- [ ] GitHub repo accessible
- [ ] SSL email valid (for Let's Encrypt)

---

## ☑️ POST-DEPLOYMENT CHECKLIST

- [ ] Frontend loads at https://durchex.com
- [ ] API responds at https://durchex.com/api
- [ ] Backend health check passes
- [ ] Database connection works
- [ ] SSL certificate valid
- [ ] Logs monitoring setup
- [ ] Backups configured
- [ ] Monitoring alerts enabled

---

**Status**: Ready to Deploy ✅  
**Estimated Time**: 15-30 minutes  
**Difficulty**: Intermediate
