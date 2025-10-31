import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { fileURLToPath } from 'url';

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Try different ports to avoid conflicts
const PORT = process.env.PORT || 3002;
const HOST = process.env.HOST || 'localhost';

// Middleware with CORS configuration - more permissive for local development
app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Disposition']
}));

// Handle preflight requests
app.options('*', cors());

// IMPORTANT: Don't use express.json() or express.urlencoded() before multer for multipart forms
// Add middleware to log all requests
app.use((req, res, next) => {
  console.log(`Received ${req.method} request to ${req.url}`);
  console.log('Request headers:', req.headers);
  next();
});

// Serve static files from both uploads/Message attached files and uploads/Expences attached file directories
// Note: The folder names are swapped from what you might expect based on their usage
app.use('/message-attachments', express.static(path.join(__dirname, '..', 'uploads', 'Message attached files')));
app.use('/admin-attachments', express.static(path.join(__dirname, '..', 'uploads', 'Expences attached file')));

// Configure multer for file uploads to users folder (for expense attachments)
const userStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // This is for expense attachments added by users (or admins for users)
    const uploadDir = path.join(__dirname, '..', 'uploads', 'Expences attached file');
    console.log('Saving expense attachment to directory:', uploadDir);
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      console.log('Creating directory:', uploadDir);
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + fileExtension;
    console.log('Generated filename for expense attachment:', filename);
    cb(null, filename);
  }
});

// Configure multer for file uploads to admin folder (for message attachments)
const adminStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // This is for message attachments sent by admins to users
    const uploadDir = path.join(__dirname, '..', 'uploads', 'Message attached files');
    console.log('Saving message attachment to directory:', uploadDir);
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      console.log('Creating directory:', uploadDir);
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + fileExtension;
    console.log('Generated filename for message attachment:', filename);
    cb(null, filename);
  }
});

const userUpload = multer({ 
  storage: userStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const adminUpload = multer({ 
  storage: adminStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'File upload server is running' });
});

// Upload endpoint for user expense attachments
// This is used for expenses added by users OR by admins for users
app.post('/upload', userUpload.single('file'), (req, res) => {
  try {
    console.log('Received upload request to /upload endpoint');
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    console.log('File received:', req.file);
    
    if (!req.file) {
      console.log('No file found in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File saved to:', req.file.path);
    
    // Return file information - path should match the folder it's stored in
    res.json({
      message: 'File uploaded successfully',
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        path: `/admin-attachments/${req.file.filename}`, // This matches the route for expense attachments
        url: `http://${HOST}:${PORT}/admin-attachments/${req.file.filename}`
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Upload endpoint for admin message attachments
app.post('/admin-upload', adminUpload.single('file'), (req, res) => {
  try {
    console.log('Received upload request to /admin-upload endpoint');
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    console.log('File received:', req.file);
    
    if (!req.file) {
      console.log('No file found in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File saved to:', req.file.path);
    
    // Return file information - path should match the folder it's stored in
    res.json({
      message: 'File uploaded successfully',
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        path: `/message-attachments/${req.file.filename}`, // This matches the route for message attachments
        url: `http://${HOST}:${PORT}/message-attachments/${req.file.filename}`
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Delete file endpoint for user expense attachments
app.delete('/file/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '..', 'uploads', 'Expences attached file', filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'File deleted successfully' });
    } else {
      // Try to find the file in the admin folder
      const adminFilePath = path.join(__dirname, '..', 'uploads', 'Message attached files', filename);
      if (fs.existsSync(adminFilePath)) {
        fs.unlinkSync(adminFilePath);
        res.json({ message: 'File deleted successfully' });
      } else {
        res.status(404).json({ error: 'File not found' });
      }
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'File deletion failed' });
  }
});

// Start server with error handling
app.listen(PORT, '0.0.0.0', () => {
  console.log(`File upload server running on port ${PORT}`);
  console.log(`Access files at http://${HOST}:${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is already in use. Please kill the process or use a different port.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});