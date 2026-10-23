// pm2 process config for running on a server (EC2): pm2 start ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'baymax',
      script: 'src/index.js',
      env: { NODE_ENV: 'production' },
    },
  ],
};
