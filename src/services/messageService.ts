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
  doc
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';

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
    
    console.log('Sending message data:', messageData);
    const docRef = await addDoc(messagesCollection, messageData);
    const result = { id: docRef.id, ...messageData };
    console.log('Message sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Upload a file and return its download URL
export const uploadFile = async (file: File, fileName: string) => {
  try {
    console.log('Uploading file to Firebase Storage:', { fileName, fileSize: file.size, fileType: file.type });
    const fileRef = ref(storage, `messages/${Date.now()}_${fileName}`);
    const snapshot = await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('File uploaded successfully:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
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

// Get all messages (for debugging purposes)
export const getAllMessages = async () => {
  try {
    const querySnapshot = await getDocs(messagesCollection);
    const messages = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as any)
    })) as Message[];
    return messages;
  } catch (error) {
    console.error('Error fetching all messages:', error);
    throw error;
  }
};

// Get messages sent by admin
export const getAdminMessages = async (adminId: string) => {
  try {
    console.log('Fetching admin messages for senderId:', adminId);
    const q = query(
      messagesCollection, 
      where('senderId', '==', adminId),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    console.log('Query returned', querySnapshot.docs.length, 'documents');
    
    const messages = querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Document data:', { id: doc.id, ...data });
      return {
        id: doc.id,
        ...(data as any)
      };
    }) as Message[];
    
    console.log('Fetched admin messages:', messages);
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
      console.log('Firebase index required for query. This is normal on first use.');
      // Re-throw the error so the calling function can handle it
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