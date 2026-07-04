// PM2 process config for the backend (VPS deploy). Start with:
//   pm2 start ecosystem.config.cjs --env production
module.exports = {
  apps: [
    {
      name: 'namecraft-api',
      script: 'src/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: { NODE_ENV: 'development' },
      env_production: { NODE_ENV: 'production' },
      max_memory_restart: '400M',
    },
  ],
};
