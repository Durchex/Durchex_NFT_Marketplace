/**
 * PM2 ecosystem config for Durchex backend (backend_temp)
 * Place this file in the actual backend folder on the server: backend_temp
 * Uses `__dirname` so `cwd` does not need manual editing when run from that folder.
 */
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
