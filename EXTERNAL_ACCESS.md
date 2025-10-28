# External Device Access Guide

This guide explains how to access the Financial ERP System from external devices on the same network.

## Prerequisites

1. Both devices must be on the same local network (WiFi/LAN)
2. The development server must be running
3. Firewall settings must allow access to the required ports

## Starting the Servers for External Access

### Development Mode

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Start the file upload server:
   ```bash
   npm run server
   ```

### Production Mode

1. Start both servers using PM2:
   ```bash
   npm run prod
   ```

## Accessing from External Devices

### Find Your Machine's IP Address

**Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" under your active network connection.

**macOS/Linux:**
```bash
ifconfig
```
or
```bash
ip addr show
```

### Connect from External Device

Once you have your machine's IP address (e.g., 192.168.1.100), access the application from any device on the same network by navigating to:

- Main Application: `http://YOUR_IP_ADDRESS:8087`
- File Server: `http://YOUR_IP_ADDRESS:3002`

For example, if your IP address is 192.168.1.100:
- Main Application: `http://192.168.1.100:8087`
- File Server: `http://192.168.1.100:3002`

## Troubleshooting

### Cannot Access from External Device

1. **Check Firewall Settings**
   - Ensure Windows Firewall or your antivirus software isn't blocking the ports
   - Add exceptions for ports 8087 and 3002

2. **Verify Server Configuration**
   - Confirm servers are configured to listen on all interfaces (0.0.0.0)
   - Check that the servers are actually running

3. **Network Issues**
   - Ensure both devices are on the same network
   - Some networks (public WiFi) may block device-to-device communication

### File Upload Issues

If file uploads fail from external devices:
1. Verify the file server is accessible at `http://YOUR_IP_ADDRESS:3002`
2. Check browser console for CORS errors
3. Ensure the file server is configured to accept requests from external origins

## Security Considerations

⚠️ **Warning**: Making servers accessible on all network interfaces can be a security risk in untrusted networks.

For production use:
1. Restrict access to specific IP addresses/ranges
2. Use HTTPS instead of HTTP
3. Implement proper authentication and authorization
4. Regularly update and patch the application