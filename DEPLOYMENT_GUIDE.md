# Production Deployment Guide

## Overview
This guide explains how to deploy the Financial ERP System in a production environment with proper file attachment handling.

## Prerequisites
- Node.js v16 or higher
- npm or yarn

## Installation Steps

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Financial-ERP-Sys
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Build the Application
```bash
npm run build
```

## Production Deployment

### Option 1: Using PM2 (Recommended)

1. Install PM2 globally (if not already installed):
```bash
npm install -g pm2
```

2. Start the application using the ecosystem configuration:
```bash
npm run prod
```

This will start both:
- The frontend application on port 8087
- The file upload server on port 3001

### Option 2: Manual Deployment

1. Start the file upload server:
```bash
npm run server
```

2. Start the frontend application:
```bash
npm run preview
```

## File Storage

All message attachments are stored in the `public/message-attachments` directory. This directory is:
- Automatically created when the first file is uploaded
- Served statically by the Vite development server
- Should be configured in your production web server to serve files directly

## Environment Variables

For production deployment, set the following environment variables:
```bash
NODE_ENV=production
PORT=3001  # For the file upload server
```

## Server Configuration

### Reverse Proxy Setup
If you're using a reverse proxy (like Nginx), configure it to:
1. Serve the frontend application on your main domain
2. Proxy `/upload`, `/file`, and `/message-attachments` requests to the file server (port 3001)

### Example Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend application
    location / {
        proxy_pass http://localhost:8087;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # File upload API
    location /upload {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # File delete API
    location /file {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Static file attachments
    location /message-attachments {
        alias /path/to/your/app/public/message-attachments;
    }
}
```

## Security Considerations

1. **File Type Validation**: The server implements basic file type validation
2. **File Size Limits**: Files are limited to 10MB
3. **Filename Sanitization**: Filenames are sanitized to prevent directory traversal attacks
4. **CORS**: CORS is enabled for local development but should be restricted in production

## Monitoring and Maintenance

### Logs
PM2 automatically handles logs. View them with:
```bash
pm2 logs
```

### Managing Services
```bash
# Stop services
npm run prod:stop

# Restart services
npm run prod:restart

# Or use PM2 directly
pm2 stop all
pm2 restart all
```

## Troubleshooting

### File Upload Issues
1. Check that the file server is running
2. Verify the `public/message-attachments` directory has write permissions
3. Check browser console for errors

### File Download Issues
1. Ensure files exist in the `public/message-attachments` directory
2. Check file permissions
3. Verify the web server configuration for static file serving

### Performance Issues
1. Monitor disk space in the `public/message-attachments` directory
2. Consider implementing file cleanup for old attachments
3. Monitor memory usage of the Node.js processes

## Backup and Recovery

Regularly backup:
1. The Firebase database
2. The `public/message-attachments` directory
3. The application code and configuration files

## Scaling Considerations

For high-traffic applications:
1. Consider using a dedicated file storage service (AWS S3, Google Cloud Storage)
2. Implement load balancing for the frontend application
3. Use a database for file metadata instead of localStorage
4. Implement caching for frequently accessed files