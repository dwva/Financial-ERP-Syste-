// Service for handling message file attachments stored locally in the file system
import { v4 as uuidv4 } from 'uuid';

// Directory where message attachments will be stored
const MESSAGE_ATTACHMENTS_DIR = '/message-attachments';

// File metadata interface
interface FileMetadata {
  id: string;
  originalName: string;
  storedName: string;
  path: string;
  size: number;
  type: string;
  uploadDate: Date;
}

// Store file metadata in localStorage
const storeFileMetadata = async (metadata: FileMetadata) => {
  try {
    const existingMetadata = getFileMetadataList();
    existingMetadata.push(metadata);
    
    // Store metadata in localStorage
    localStorage.setItem('messageFileMetadata', JSON.stringify(existingMetadata));
  } catch (error) {
    console.error('Error storing file metadata:', error);
  }
};

// Get file metadata list from localStorage
const getFileMetadataList = (): FileMetadata[] => {
  try {
    const metadata = localStorage.getItem('messageFileMetadata');
    return metadata ? JSON.parse(metadata) : [];
  } catch (error) {
    console.error('Error retrieving file metadata:', error);
    return [];
  }
};

// Save file to the message attachments directory (for production, this uses the backend API)
export const saveMessageFile = async (file: File): Promise<{ url: string; fileName: string; fileId: string }> => {
  try {
    // Generate a unique ID for the file
    const fileId = uuidv4();
    
    // Create a new filename to avoid conflicts
    const fileExtension = file.name.split('.').pop() || '';
    const storedName = `${fileId}.${fileExtension}`;
    
    // Log environment information for debugging
    console.log('Environment detection:', {
      mode: import.meta.env.MODE,
      isProduction: import.meta.env.MODE === 'production',
      prodEnv: import.meta.env.PROD,
      devEnv: import.meta.env.DEV
    });
    
    // Force the use of the file server for all environments (development and production)
    // This ensures file attachments work correctly in both modes
    console.log('Using file server upload method');
    
    // Use backend API for file upload
    const formData = new FormData();
    formData.append('file', file);
    
    // Use the file server URL (port 3002)
    const uploadUrl = `${window.location.protocol}//${window.location.hostname}:3002/upload`;
    console.log('Uploading file to:', uploadUrl);
    
    // Add timeout and retry logic
    const response = await fetchWithTimeout(uploadUrl, {
      method: 'POST',
      body: formData,
      // Add credentials and mode for CORS
      credentials: 'include',
      mode: 'cors'
    }, 10000); // 10 second timeout
    
    console.log('Upload response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload failed with response:', errorText);
      throw new Error(`Failed to upload file to server: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Upload successful:', result);
    
    // Create metadata
    const metadata: FileMetadata = {
      id: fileId,
      originalName: file.name,
      storedName,
      path: result.file.path,
      size: file.size,
      type: file.type,
      uploadDate: new Date()
    };
    
    // Store metadata
    await storeFileMetadata(metadata);
    
    // Return file information
    return {
      url: result.file.url,
      fileName: file.name,
      fileId
    };
  } catch (error: any) {
    console.error('Error saving message file:', error);
    // More specific error handling
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Failed to connect to file upload server. Please ensure the server is running on port 3002 and accessible from your network.');
    }
    throw new Error(`Failed to save message file: ${error.message || error.toString()}`);
  }
};

// Helper function with timeout
async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Get file metadata by ID
export const getFileMetadata = (fileId: string): FileMetadata | null => {
  try {
    const metadataList = getFileMetadataList();
    return metadataList.find(meta => meta.id === fileId) || null;
  } catch (error) {
    console.error('Error retrieving file metadata:', error);
    return null;
  }
};

// Get all file metadata
export const getAllFileMetadata = (): FileMetadata[] => {
  return getFileMetadataList();
};

// Delete file metadata and file data
export const deleteFileMetadata = (fileId: string): boolean => {
  try {
    // Get the file metadata to find the sessionStorage key
    const metadataList = getFileMetadataList();
    const fileMetadata = metadataList.find(meta => meta.id === fileId);
    
    if (fileMetadata) {
      // TODO: Call backend API to delete file
      // For now, we'll just remove the metadata
    }
    
    // Remove metadata from localStorage
    const updatedList = metadataList.filter(meta => meta.id !== fileId);
    localStorage.setItem('messageFileMetadata', JSON.stringify(updatedList));
    return true;
  } catch (error) {
    console.error('Error deleting file metadata:', error);
    return false;
  }
};

// Clear all file metadata and file data
export const clearAllFileMetadata = (): void => {
  try {
    // Remove metadata from localStorage
    localStorage.removeItem('messageFileMetadata');
  } catch (error) {
    console.error('Error clearing file metadata:', error);
  }
};

// Download a file
export const downloadLocalFile = (fileId: string, fileName: string): void => {
  try {
    // Get the file metadata to find the file path
    const metadataList = getFileMetadataList();
    const fileMetadata = metadataList.find(meta => meta.id === fileId);
    
    if (!fileMetadata) {
      throw new Error('File not found');
    }
    
    // Create a temporary link to download the file
    const a = document.createElement('a');
    // Use the full URL including the hostname for external access
    const fileUrl = `${window.location.protocol}//${window.location.hostname}:3002${fileMetadata.path}`;
    a.href = fileUrl;
    a.download = fileName;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw new Error('Failed to download file');
  }
};

export default {
  saveMessageFile,
  getFileMetadata,
  getAllFileMetadata,
  deleteFileMetadata,
  clearAllFileMetadata,
  downloadLocalFile
};