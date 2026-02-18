module.exports = {
  apps: [
    {
      name: 'durchex-pending-processor',
      script: './backend_temp/services/pendingProcessor.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production',
        # MongoDB connection (example from backend_temp/.env)
        DATABASE: 'mongodb+srv://durchex_db_user:Durchex2025..@durchex-cluster.otgf1xa.mongodb.net/?appName=durchex-cluster',
        MONGO_URI: 'mongodb+srv://durchex_db_user:Durchex2025..@durchex-cluster.otgf1xa.mongodb.net/?appName=durchex-cluster',
        MONGODB_URI: 'mongodb+srv://durchex_db_user:Durchex2025..@durchex-cluster.otgf1xa.mongodb.net/?appName=durchex-cluster',
        # RPC (replace with a stable/authenticated RPC for production)
        BASE_RPC_URL: 'https://mainnet.base.org',
        RPC_URL: 'https://mainnet.base.org',
        # Optional
        PORT: '3000'
      },
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 5000
    },
    {
      name: 'durchex-transfer-indexer',
      script: './backend_temp/services/transferIndexer.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production',
        DATABASE: 'mongodb+srv://durchex_db_user:Durchex2025..@durchex-cluster.otgf1xa.mongodb.net/?appName=durchex-cluster',
        MONGO_URI: 'mongodb+srv://durchex_db_user:Durchex2025..@durchex-cluster.otgf1xa.mongodb.net/?appName=durchex-cluster',
        MONGODB_URI: 'mongodb+srv://durchex_db_user:Durchex2025..@durchex-cluster.otgf1xa.mongodb.net/?appName=durchex-cluster',
        BASE_RPC_URL: 'https://mainnet.base.org',
        RPC_URL: 'https://mainnet.base.org'
      },
      autorestart: true,
      watch: false
    }
  ]
};

module.exports = {
  apps: [
    {
      name: 'durchex-backend',
      script: 'server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000
      }
    }
  ]
};
