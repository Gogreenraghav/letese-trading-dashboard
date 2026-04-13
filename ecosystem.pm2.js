module.exports = {
  apps: [
    {
      name: 'backend',
      cwd: '/root/clawd/trading-saas/backend',
      script: '/usr/bin/python3',
      args: '-m uvicorn app.main:app --host 0.0.0.0 --port 8002',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: 5000,
    },
    {
      name: 'user-dashboard',
      cwd: '/root/clawd/trading-saas/frontend/user-dashboard',
      script: 'node_modules/.bin/next',
      args: 'start --port 3015',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: 5000,
    },
    {
      name: 'sa-dashboard',
      cwd: '/root/clawd/trading-saas/frontend/super-admin',
      script: 'node_modules/.bin/next',
      args: 'start --port 3014',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: 5000,
    },
    {
      name: 'trading-bot',
      cwd: '/root/clawd/nse-bse-bot',
      script: 'node',
      args: 'src/orchestrator-entry.js',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: 5000,
    },
  ]
};
