import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Message } from '@/services/messageService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileText, Mail, MailOpen, Clock, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

const MessagesPage = () => {
  const { getUserMessages, markMessageAsRead, getAllMessages, deleteMessage } = useData();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [indexError, setIndexError] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [messageToDelete, setMessageToDelete] = useState<{ id: string; subject: string } | null>(null);

  // Get user's messages
  const fetchMessages = async () => {
    if (user?.email) {
      try {
        setLoading(true);
        setIndexError(false);
        console.log('Fetching messages for user with email:', user.email);
        
        // First try the Firebase query
        let userMessages = [];
        try {
          userMessages = await getUserMessages(user.email);
          console.log('Fetched messages using Firebase query:', userMessages);
        } catch (queryError: any) {
          console.log('Firebase query failed, falling back to client-side filtering');
          console.log('Error details:', queryError);
          // If Firebase query fails due to index requirements, inform the user
          if (queryError.message && queryError.message.includes('query requires an index')) {
            setIndexError(true);
            toast.info('Setting up message system. This may take a moment. Please try again in a few seconds.');
            return;
          }
          // Fall back to client-side filtering
          const allMessages = await getAllMessages();
          userMessages = allMessages.filter((msg: any) => msg.receiverId === user.email);
          console.log('Fetched messages using client-side filtering:', userMessages);
        }
        
        setMessages(userMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to load messages');
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [user, getUserMessages]);

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await markMessageAsRead(messageId);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, read: true } : msg
        )
      );
      toast.success('Message marked as read');
    } catch (error) {
      console.error('Error marking message as read:', error);
      toast.error('Failed to mark message as read');
    }
  };

  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return 'Unknown';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return 'Unknown';
    }
  };

  const unreadCount = messages.filter(msg => !msg.read).length;

  // Function to delete a message
  const handleDeleteMessage = async (messageId: string, messageSubject: string) => {
    if (!messageId) {
      toast.error('Invalid message ID');
      return;
    }
    
    // Set the message to delete and open the dialog
    setMessageToDelete({ id: messageId, subject: messageSubject });
    setDeleteDialogOpen(true);
  };

  // Function to confirm deletion
  const confirmDeleteMessage = async () => {
    if (!messageToDelete) {
      toast.error('No message selected for deletion');
      return;
    }
    
    try {
      setLoading(true);
      setDeleteDialogOpen(false);
      console.log('Deleting message with ID:', messageToDelete.id);
      await deleteMessage(messageToDelete.id);
      console.log('Message deleted successfully');
      
      // Remove the message from the local state
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageToDelete.id));
      
      toast.success('Message deleted successfully');
    } catch (error: any) {
      console.error('Error deleting message:', error);
      toast.error(`Failed to delete message: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
      setMessageToDelete(null);
    }
  };

  // Function to cancel deletion
  const cancelDeleteMessage = () => {
    setDeleteDialogOpen(false);
    setMessageToDelete(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Messages</CardTitle>
            <CardDescription>Your received messages</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {unreadCount} unread
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchMessages}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
              <p>Loading messages...</p>
            </div>
          </div>
        ) : indexError ? (
          <div className="text-center py-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
              <div className="flex justify-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-blue-800 mb-2">Setting up message system</h3>
              <p className="text-blue-700 mb-4">
                We're creating an index to optimize your message performance. This is a one-time setup that may take a few moments.
              </p>
              <p className="text-blue-600 text-sm mb-4">
                Please wait or try refreshing the page in a minute.
              </p>
              <Button 
                variant="outline" 
                onClick={fetchMessages}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No messages yet</h3>
            <p className="text-gray-500">You don't have any messages at this time.</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((message) => (
                  <TableRow 
                    key={message.id} 
                    className={!message.read ? 'bg-blue-50' : ''}
                  >
                    <TableCell>
                      {message.read ? (
                        <MailOpen className="w-4 h-4 text-gray-500" />
                      ) : (
                        <Mail className="w-4 h-4 text-blue-500" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {message.senderName}
                    </TableCell>
                    <TableCell>{message.subject}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{formatTimestamp(message.timestamp)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {message.fileName ? (
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span className="text-sm">{message.fileName}</span>
                        </div>
                      ) : (
                        'No file attached'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {!message.read && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => message.id && handleMarkAsRead(message.id)}
                          >
                            Mark as Read
                          </Button>
                        )}
                        {message.fileUrl && message.fileName && (
                          <a 
                            href={message.fileUrl} 
                            download={message.fileName}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </a>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => message.id && handleDeleteMessage(message.id, message.subject)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the message
                {messageToDelete ? ` "${messageToDelete.subject}"` : ''}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelDeleteMessage}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteMessage} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default MessagesPage;