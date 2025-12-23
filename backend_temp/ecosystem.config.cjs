/**
 * PM2 ecosystem config (CommonJS) for Durchex backend_temp
 * PM2 requires CommonJS when the package scope uses "type":"module".
 * Place this file in `backend_temp` on the server and run `pm2 start ecosystem.config.cjs`.
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
