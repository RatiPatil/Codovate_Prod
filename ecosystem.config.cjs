module.exports = {
  apps: [{
    name: 'codovate-backend',
    cwd: '/home/codovate/apps/Codovate_Prod/backend',
    script: 'server.js',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '700M',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    time: true
  }]
};
