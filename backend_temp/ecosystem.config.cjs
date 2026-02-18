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
        DATABASE: 'mongodb+srv://durchex_db_user:Durchex2025..@durchex-cluster.otgf1xa.mongodb.net/?appName=durchex-cluster',
        MONGO_URI: 'mongodb+srv://durchex_db_user:Durchex2025..@durchex-cluster.otgf1xa.mongodb.net/?appName=durchex-cluster',
        MONGODB_URI: 'mongodb+srv://durchex_db_user:Durchex2025..@durchex-cluster.otgf1xa.mongodb.net/?appName=durchex-cluster',
        BASE_RPC_URL: 'https://mainnet.base.org',
        RPC_URL: 'https://mainnet.base.org',
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
