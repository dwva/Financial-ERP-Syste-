// Message service for handling admin to user messaging
import { db, storage } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp,
  updateDoc,
  doc,
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { saveMessageFile, saveExpenseFile } from '@/services/messageFileService'; // Import local storage service

// Collection references
const messagesCollection = collection(db, 'messages');

// Message interface
export interface Message {
  id?: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  subject: string;
  content: string;
  fileUrl?: string;
  fileName?: string;
  timestamp: Timestamp;
  read: boolean;
}

// Send a message
export const sendMessage = async (message: Omit<Message, 'id' | 'timestamp'>) => {
  try {
    const messageData = {
      ...message,
      timestamp: Timestamp.now(),
      read: false
    };
    
    const docRef = await addDoc(messagesCollection, messageData);
    const result = { id: docRef.id, ...messageData };
    
    return result;
  } catch (error) {
    console.error('Service: Error sending message:', error);
    throw error;
  }
};

// Upload a file and return its download URL for messages
export const uploadMessageFile = async (file: File, fileName: string) => {
  try {
    console.log('Uploading message file:', { fileName, fileSize: file.size, fileType: file.type });
    // Use saveMessageFile for message attachments to store them in the correct location
    const localFileResult = await saveMessageFile(file);
    console.log('Message file saved:', localFileResult);
    return localFileResult.url;
  } catch (error: any) {
    console.error('Error uploading message file:', error);
    throw new Error(`Message file upload failed: ${error.message || 'Unknown error'}`);
  }
};

// Upload a file and return its download URL for expenses
export const uploadExpenseFile = async (file: File, fileName: string) => {
  try {
    console.log('Uploading expense file:', { fileName, fileSize: file.size, fileType: file.type });
    // Use saveExpenseFile for expense attachments to store them in the correct location
    const localFileResult = await saveExpenseFile(file);
    console.log('Expense file saved:', localFileResult);
    return localFileResult.url;
  } catch (error: any) {
    console.error('Error uploading expense file:', error);
    throw new Error(`Expense file upload failed: ${error.message || 'Unknown error'}`);
  }
};

// DEPRECATED: This function should no longer be used directly
// Use uploadMessageFile or uploadExpenseFile instead
export const uploadFile = async (file: File, fileName: string) => {
  try {
    console.log('Uploading file:', { fileName, fileSize: file.size, fileType: file.type });
    // Always use saveExpenseFile for expense attachments, regardless of who is adding them
    // This ensures all expense attachments are stored in the correct location and accessible to admins
    const localFileResult = await saveExpenseFile(file);
    console.log('File saved:', localFileResult);
    return localFileResult.url;
  } catch (error: any) {
    console.error('Error uploading file:', error);
    throw new Error(`File upload failed: ${error.message || 'Unknown error'}`);
  }
};

// Get messages for a specific user
export const getUserMessages = async (userId: string) => {
  try {
    const q = query(
      messagesCollection, 
      where('receiverId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as any)
    })) as Message[];
  } catch (error: any) {
    console.error('Error fetching user messages:', error);
    // Re-throw the error so the calling function can handle it
    throw error;
  }
};

// Get a specific message by ID (for debugging)
export const getMessageById = async (messageId: string) => {
  try {
    console.log('Fetching message by ID:', messageId);
    const messageDoc = doc(db, 'messages', messageId);
    const docSnap = await getDoc(messageDoc);
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('Found message:', { id: docSnap.id, ...data });
      return { id: docSnap.id, ...data };
    } else {
      console.log('No message found with ID:', messageId);
      return null;
    }
  } catch (error) {
    console.error('Error fetching message by ID:', error);
    throw error;
  }
};

// Get all messages (for debugging purposes)
export const getAllMessages = async () => {
  try {
    console.log('Fetching all messages from database');
    const querySnapshot = await getDocs(messagesCollection);
    console.log('Total messages in database:', querySnapshot.docs.length);
    const messages = querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Message data:', { id: doc.id, ...data });
      return {
        id: doc.id,
        ...(data as any)
      };
    }) as Message[];
    console.log('Fetched all messages:', messages);
    return messages;
  } catch (error) {
    console.error('Error fetching all messages:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    throw error;
  }
};

// Get messages sent by admin
export const getAdminMessages = async (adminId: string) => {
  try {
    const q = query(
      messagesCollection, 
      where('senderId', '==', adminId),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const messages = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...(data as any)
      };
    }) as Message[];
    
    return messages;
  } catch (error: any) {
    console.error('Error fetching admin messages:', error);
    // Provide more detailed error information
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied: You do not have access to view message history');
    } else if (error.code === 'unavailable') {
      throw new Error('Service unavailable: Please try again later');
    } else if (error.code === 'failed-precondition' && error.message.includes('query requires an index')) {
      // Handle the index requirement error
      throw error;
    } else {
      throw new Error(`Failed to load message history: ${error.message || 'Unknown error'}`);
    }
  }
};

// Mark a message as read
export const markMessageAsRead = async (messageId: string) => {
  try {
    const messageDoc = doc(db, 'messages', messageId);
    await updateDoc(messageDoc, { read: true });
    return messageId;
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
};

// Delete a message
export const deleteMessage = async (messageId: string) => {
  try {
    const messageDoc = doc(db, 'messages', messageId);
    // Note: In a production environment, you might want to implement soft delete
    // or move messages to an archive collection instead of hard deleting
    await deleteDoc(messageDoc);
    return messageId;
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};