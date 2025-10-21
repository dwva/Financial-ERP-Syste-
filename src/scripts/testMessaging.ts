// Script to test messaging functionality
import { sendMessage, getUserMessages, getAdminMessages } from '@/services/messageService';

const testMessaging = async () => {
  try {
    console.log('Testing messaging functionality...');
    
    // Test sending a message
    const testMessage = {
      senderId: 'admin@company.com',
      senderName: 'Admin User',
      receiverId: 'deva123@gmail.com',
      receiverName: 'Deva',
      subject: 'Test Message',
      content: 'This is a test message from the admin.',
      read: false
    };
    
    const sentMessage = await sendMessage(testMessage);
    console.log('Message sent successfully!', sentMessage);
    
    // Test getting user messages
    const userMessages = await getUserMessages('deva123@gmail.com');
    console.log(`User has ${userMessages.length} messages`);
    
    // Test getting admin messages
    const adminMessages = await getAdminMessages('admin@company.com');
    console.log(`Admin has sent ${adminMessages.length} messages`);
    
    console.log('Messaging test completed successfully!');
  } catch (error) {
    console.error('Error testing messaging:', error);
  }
};

// Run the script
testMessaging();