module.exports = {
  apps: [
    {
      name: 'financial-erp-frontend',
      script: 'node_modules/vite/bin/vite.js',
      args: 'preview --port 8087 --host 0.0.0.0',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'financial-erp-file-server',
      script: 'server/index.js',
      cwd: './',
      args: '--host 0.0.0.0',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3002 // Changed from 3001 to 3002
      }
    }
  ]
};