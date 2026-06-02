module.exports = {
  apps: [
    // ── Main API server ──────────────────────────────────────────────────────
    {
      name: 'durchex-backend',
      script: 'server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      env_production: {
        NODE_ENV: 'production',
        PORT: '3001',
        DATABASE:    'mongodb+srv://durchex_db_user:Durchex2026@durchex-cluster.otgf1xa.mongodb.net/?appName=durchex-cluster',
        MONGO_URI:   'mongodb+srv://durchex_db_user:Durchex2026@durchex-cluster.otgf1xa.mongodb.net/?appName=durchex-cluster',
        MONGODB_URI: 'mongodb+srv://durchex_db_user:Durchex2026@durchex-cluster.otgf1xa.mongodb.net/?appName=durchex-cluster',
        BASE_RPC_URL: 'https://mainnet.base.org',
        RPC_URL:      'https://mainnet.base.org',
      },
    },

    // ── Pending transfer processor ───────────────────────────────────────────
    {
      name: 'durchex-pending-processor',
      script: './services/pendingProcessor.js',
      cwd: __dirname,
      interpreter: 'node',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      env_production: {
        NODE_ENV: 'production',
        DATABASE:    'mongodb+srv://durchex_db_user:Durchex2026@durchex-cluster.otgf1xa.mongodb.net/?appName=durchex-cluster',
        MONGO_URI:   'mongodb+srv://durchex_db_user:Durchex2026@durchex-cluster.otgf1xa.mongodb.net/?appName=durchex-cluster',
        MONGODB_URI: 'mongodb+srv://durchex_db_user:Durchex2026@durchex-cluster.otgf1xa.mongodb.net/?appName=durchex-cluster',
        BASE_RPC_URL:      'https://mainnet.base.org',
        RPC_URL:           'https://mainnet.base.org',
        ETHEREUM_RPC_URL:  'https://cloudflare-eth.com',
        POLYGON_RPC_URL:   'https://polygon-rpc.com',
        BSC_RPC_URL:       'https://bsc-dataseed.binance.org',
        ARBITRUM_RPC_URL:  'https://arb1.arbitrum.io/rpc',
        OPTIMISM_RPC_URL:  'https://mainnet.optimism.io',
        AVALANCHE_RPC_URL: 'https://api.avax.network/ext/bc/C/rpc',
      },
    },

    // ── Transfer indexer ─────────────────────────────────────────────────────
    {
      name: 'durchex-transfer-indexer',
      script: './services/transferIndexer.js',
      cwd: __dirname,
      interpreter: 'node',
      watch: false,
      autorestart: true,
      env_production: {
        NODE_ENV: 'production',
        DATABASE:    'mongodb+srv://durchex_db_user:Durchex2026@durchex-cluster.otgf1xa.mongodb.net/?appName=durchex-cluster',
        MONGO_URI:   'mongodb+srv://durchex_db_user:Durchex2026@durchex-cluster.otgf1xa.mongodb.net/?appName=durchex-cluster',
        MONGODB_URI: 'mongodb+srv://durchex_db_user:Durchex2026@durchex-cluster.otgf1xa.mongodb.net/?appName=durchex-cluster',
        BASE_RPC_URL: 'https://mainnet.base.org',
        RPC_URL:      'https://mainnet.base.org',
      },
    },
  ],
};
