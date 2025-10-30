import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { Message } from '@/services/messageService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileText, Mail, MailOpen, Clock, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { downloadLocalFile } from '@/services/messageFileService';

const MessagesPage = () => {
  const { messages, markMessageAsRead, deleteMessage, loading: dataLoading } = useData();
  const { user } = useAuth();
  const { markAsRead } = useNotification();
  const [loading, setLoading] = useState<boolean>(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [messageToDelete, setMessageToDelete] = useState<{ id: string; subject: string } | null>(null);
  const [userMessages, setUserMessages] = useState<Message[]>([]);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);

  // Filter messages for the current user
  useEffect(() => {
    if (messages.length > 0 && user?.email) {
      const filteredMessages = messages.filter(msg => msg.receiverId === user.email);
      setUserMessages(filteredMessages);
      setLoading(false);
    } else if (messages.length === 0) {
      setLoading(false);
    }
  }, [messages, user]);

  // Mark all messages as read when the user views the messages page
  useEffect(() => {
    if (userMessages.length > 0 && user?.email) {
      // Find unread messages for this user
      const unreadMessages = userMessages.filter(msg => !msg.read);
      
      // Mark each unread message as read
      unreadMessages.forEach(async (message) => {
        try {
          await markMessageAsRead(message.id!);
          
          // Also mark any related notifications as read
          // In a real implementation, you might want to find notifications by messageId
        } catch (error) {
          console.error('Error marking message as read:', error);
        }
      });
      
      // Show a toast notification if there were new messages
      if (unreadMessages.length > 0) {
        toast.success(`Marked ${unreadMessages.length} message(s) as read`);
      }
    }
  }, [userMessages, user?.email]);

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await markMessageAsRead(messageId);
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

  const unreadCount = userMessages.filter(msg => !msg.read).length;

  // Function to download a file
  const handleDownloadFile = async (fileUrl: string, fileName: string) => {
    // Check if this is a local file URL
    if (fileUrl.startsWith('localfile://')) {
      // Extract file ID from the URL
      const fileId = fileUrl.split('://')[1].split('/')[0];
      await downloadLocalFile(fileId, fileName);
    } else {
      // For Firebase URLs, use fetch API to force download
      try {
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error downloading file:', error);
        toast.error('Failed to download file');
      }
    }
  };

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
              onClick={() => setLoading(!loading)} // Simple refresh toggle
              disabled={dataLoading}
            >
              <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading || dataLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
              <p>Loading messages...</p>
            </div>
          </div>
        ) : userMessages.length === 0 ? (
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
                  <TableHead>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        checked={selectedMessages.length === userMessages.length && userMessages.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMessages(userMessages.map(msg => msg.id!));
                          } else {
                            setSelectedMessages([]);
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Select All</span>
                    </div>
                  </TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userMessages.map((message) => (
                  <TableRow 
                    key={message.id} 
                    className={!message.read ? 'bg-blue-50' : ''}
                  >
                    <TableCell>
                      <input 
                        type="checkbox" 
                        checked={selectedMessages.includes(message.id!)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMessages([...selectedMessages, message.id!]);
                          } else {
                            setSelectedMessages(selectedMessages.filter(id => id !== message.id));
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
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
                          {message.fileUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadFile(message.fileUrl!, message.fileName!)}
                              className="ml-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadFile(message.fileUrl!, message.fileName!)}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
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