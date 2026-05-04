module.exports = {
  apps: [
    {
      name: 'sfs-app',
      script: 'npm',
      args: 'start',
      cwd: '/home/deploy/sfs-app',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/pm2/sfs-app-error.log',
      out_file: '/var/log/pm2/sfs-app-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
