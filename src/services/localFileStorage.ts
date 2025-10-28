// Local file storage service for development purposes
// This is a temporary solution until Firebase Storage CORS is properly configured

export interface LocalFileReference {
  id: string;
  name: string;
  size: number;
  type: string;
  timestamp: Date;
  // Store the actual file content for download
  content: string;
}

// In-memory storage for development
const localFileStorage: Map<string, LocalFileReference> = new Map();

export const saveFileLocally = async (file: File): Promise<LocalFileReference> => {
  // Create a reference ID
  const id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Convert file to base64 string for storage
  const content = await fileToBase64(file);
  
  // Create file reference
  const fileRef: LocalFileReference = {
    id,
    name: file.name,
    size: file.size,
    type: file.type,
    timestamp: new Date(),
    content
  };
  
  // Store in memory
  localFileStorage.set(id, fileRef);
  
  console.log('File saved locally:', fileRef);
  
  return fileRef;
};

// Convert file to base64 string
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const getFileReference = (id: string): LocalFileReference | undefined => {
  return localFileStorage.get(id);
};

export const getAllFileReferences = (): LocalFileReference[] => {
  return Array.from(localFileStorage.values());
};

export const deleteFileReference = (id: string): boolean => {
  return localFileStorage.delete(id);
};

// Create a downloadable URL for a local file
export const createDownloadUrl = (fileRef: LocalFileReference): string => {
  // Store file data in sessionStorage for retrieval
  try {
    sessionStorage.setItem(`localFile_${fileRef.id}`, fileRef.content);
    // Return a special URL that our download handler can recognize
    return `localfile://${fileRef.id}/${encodeURIComponent(fileRef.name)}`;
  } catch (error) {
    console.error('Error creating download URL:', error);
    return '';
  }
};

// Download a local file
export const downloadLocalFile = (fileId: string, fileName: string): void => {
  try {
    const content = sessionStorage.getItem(`localFile_${fileId}`);
    if (!content) {
      console.error('File content not found for download');
      return;
    }
    
    // Convert base64 to blob
    const byteString = atob(content.split(',')[1]);
    const mimeString = content.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading local file:', error);
  }
};

// Mock upload function that simulates the Firebase upload process
export const mockFileUpload = async (file: File, fileName: string): Promise<string> => {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Save file reference locally
    const fileRef = await saveFileLocally(file);
    
    // Create a download URL
    const downloadUrl = createDownloadUrl(fileRef);
    
    console.log('Mock file upload successful:', { fileName, fileSize: file.size, fileType: file.type, downloadUrl });
    
    return downloadUrl;
  } catch (error) {
    console.error('Error in mock file upload:', error);
    throw new Error(`Mock file upload failed: ${error.message || 'Unknown error'}`);
  }
};