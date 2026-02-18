PM2 startup guide for Durchex background services

Prerequisites
- Ensure your `.env` contains `DATABASE` / `MONGO_URI` / `MONGODB_URI` and RPC variables (e.g. `BASE_RPC_URL` or `RPC_URL`).
- Node >= 18 and `pm2` installed globally: `npm install -g pm2`

Start services (recommended)

1. From project root, load environment then start PM2 ecosystem:

```bash
# If you rely on a .env file, export variables first (example):
export $(cat backend_temp/.env | grep -v '^#' | xargs)

# Start both services defined in the ecosystem
pm2 start backend_temp/ecosystem.config.js --env production
```

2. Useful PM2 commands

```bash
pm2 ls                                   # list processes
pm2 logs durchex-pending-processor       # view pending processor logs
pm2 logs durchex-transfer-indexer        # view indexer logs
pm2 stop durchex-pending-processor
pm2 restart durchex-pending-processor
pm2 delete durchex-transfer-indexer

# Persist process list and enable startup on reboot (follow printed instructions):
pm2 save
pm2 startup
```

Notes
- PM2 does not automatically parse `.env`; export env vars in your shell or inject them via your system's service manager. For production deployments prefer setting environment variables in the host or a secrets manager.
- Adjust the `ecosystem.config.js` file if your service file locations differ.
- You can run each script directly for debugging: `node backend_temp/services/pendingProcessor.js`.
