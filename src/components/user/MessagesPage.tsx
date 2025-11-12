import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { Message } from '@/services/messageService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileText, Mail, MailOpen, Clock, RefreshCw, Trash2, Eye, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { downloadLocalFile } from '@/services/messageFileService';
import { Timestamp } from 'firebase/firestore';

// File viewer modal component
const FileViewerModal = ({ 
  isOpen, 
  onClose, 
  fileUrl, 
  fileName 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  fileUrl: string; 
  fileName: string; 
}) => {
  if (!isOpen) return null;

  const isImage = fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i);
  const isPdf = fileName.match(/\.pdf$/i);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold truncate">{fileName}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {isImage ? (
            <div className="flex justify-center">
              <img 
                src={fileUrl} 
                alt={fileName} 
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          ) : isPdf ? (
            <div className="flex justify-center">
              <iframe 
                src={fileUrl} 
                className="w-full h-[70vh]"
                title={fileName}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center">
              <FileText className="w-16 h-16 text-gray-400 mb-4" />
              <p className="mb-4">This file type cannot be previewed directly.</p>
              <Button onClick={() => window.open(fileUrl, '_blank')}>
                <Download className="w-4 h-4 mr-2" />
                Download File
              </Button>
            </div>
          )}
        </div>
        <div className="p-4 border-t flex justify-end">
          <Button onClick={() => window.open(fileUrl, '_blank')}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
};

const MessagesPage = () => {
  const { messages, markMessageAsRead, deleteMessage, loading: dataLoading, getUnreadMessageCount } = useData();
  const { user } = useAuth();
  const { notifications, markAsRead } = useNotification();
  const [loading, setLoading] = useState<boolean>(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [messageToDelete, setMessageToDelete] = useState<{ id: string; subject: string } | null>(null);
  const [userMessages, setUserMessages] = useState<Message[]>([]);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [fileViewerOpen, setFileViewerOpen] = useState<boolean>(false);
  const [currentFile, setCurrentFile] = useState<{ url: string; name: string } | null>(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState<number>(0); // Track unread message count

  // Helper function to convert timestamp to Date
  const convertTimestampToDate = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    try {
      // Handle Firebase Timestamp objects
      if (timestamp instanceof Timestamp) {
        return timestamp.toDate();
      }
      // Handle objects with toDate method (like Firebase Timestamp)
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
      }
      // Handle regular Date objects
      if (timestamp instanceof Date) {
        return timestamp;
      }
      // Handle string timestamps
      if (typeof timestamp === 'string') {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      // Handle number timestamps (Unix timestamps)
      if (typeof timestamp === 'number') {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      return new Date();
    } catch (error) {
      console.error('Error converting timestamp:', error);
      return new Date();
    }
  };

  // Filter messages for the current user and sort by date
  useEffect(() => {
    if (messages.length > 0 && user?.email) {
      const filteredMessages = messages
        .filter(msg => msg.receiverId === user.email)
        .sort((a, b) => {
          // Convert timestamps to Date objects for comparison
          const dateA = convertTimestampToDate(a.timestamp);
          const dateB = convertTimestampToDate(b.timestamp);
          
          // Sort based on selected order
          if (sortOrder === 'newest') {
            return dateB.getTime() - dateA.getTime(); // Descending (newest first)
          } else {
            return dateA.getTime() - dateB.getTime(); // Ascending (oldest first)
          }
        });
      setUserMessages(filteredMessages);
      
      // Calculate unread message count for this user
      const unreadCount = getUnreadMessageCount(user.email);
      setUnreadMessageCount(unreadCount);
      
      setLoading(false);
    } else if (messages.length === 0) {
      setUserMessages([]);
      setUnreadMessageCount(0);
      setLoading(false);
    }
  }, [messages, user, sortOrder, getUnreadMessageCount]);

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
          // Find notifications that correspond to this message and mark them as read
          if (message.id) {
            const relatedNotifications = notifications.filter(
              notification => notification.messageId === message.id
            );
            
            relatedNotifications.forEach(notification => {
              markAsRead(notification.id);
            });
          }
        } catch (error) {
          console.error('Error marking message as read:', error);
        }
      });
      
      // Show a toast notification if there were new messages
      if (unreadMessages.length > 0) {
        toast.success(`Marked ${unreadMessages.length} message(s) as read`);
        // Update the unread count
        setUnreadMessageCount(0);
      }
    }
  }, [userMessages, user?.email, notifications, markAsRead, markMessageAsRead]);

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await markMessageAsRead(messageId);
      
      // Also mark any related notifications as read
      const relatedNotifications = notifications.filter(
        notification => notification.messageId === messageId
      );
      
      relatedNotifications.forEach(notification => {
        markAsRead(notification.id);
      });
      
      // Update the unread count
      if (user?.email) {
        const updatedCount = getUnreadMessageCount(user.email);
        setUnreadMessageCount(updatedCount);
      }
      
      toast.success('Message marked as read');
    } catch (error) {
      console.error('Error marking message as read:', error);
      toast.error('Failed to mark message as read');
    }
  };

  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return 'Unknown';
    try {
      const date = convertTimestampToDate(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return 'Unknown';
    }
  };

  // Function to download a file
  const handleDownloadFile = async (fileUrl: string, fileName: string) => {
    // Check if this is a local file URL
    if (fileUrl.startsWith('localfile://')) {
      // Extract file ID from the URL
      const fileId = fileUrl.split('://')[1].split('/')[0];
      await downloadLocalFile(fileId, fileName);
    } else {
      // For server URLs, use fetch API to force download
      try {
        // For message attachments, they should be accessible via /message-attachments/ path
        // since they're stored in the "Message attached files" folder
        const correctedFileUrl = fileUrl.replace('/admin-attachments/', '/message-attachments/');
        
        const response = await fetch(correctedFileUrl);
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

  // Function to view a file in modal
  const handleViewFile = (fileUrl: string, fileName: string) => {
    setCurrentFile({ url: fileUrl, name: fileName });
    setFileViewerOpen(true);
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

  // Function to toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest');
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
            {unreadMessageCount > 0 && (
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {unreadMessageCount} unread
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleSortOrder}
            >
              Sort: {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setLoading(!loading)}
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
                    <TableCell className="font-medium">{message.senderName || message.senderId}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {!message.read && (
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        )}
                        <span>{message.subject}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatTimestamp(message.timestamp)}
                    </TableCell>
                    <TableCell>
                      {message.fileName ? (
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                            {message.fileName}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewFile(message.fileUrl, message.fileName!)}
                              className="h-5 w-5 p-0"
                            >
                              <Eye className="w-2.5 h-2.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadFile(message.fileUrl, message.fileName!)}
                              className="h-5 w-5 p-0"
                            >
                              <Download className="w-2.5 h-2.5" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No file</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {!message.read ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsRead(message.id!)}
                            className="h-8 px-2"
                          >
                            <MailOpen className="w-3 h-3 mr-1" />
                            Mark Read
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="h-8 px-2"
                          >
                            <MailOpen className="w-3 h-3 mr-1" />
                            Read
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteMessage(message.id!, message.subject)}
                          className="h-8 px-2"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the message "{messageToDelete?.subject}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDeleteMessage}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteMessage}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* File Viewer Modal */}
      <FileViewerModal 
        isOpen={fileViewerOpen}
        onClose={() => setFileViewerOpen(false)}
        fileUrl={currentFile?.url || ''}
        fileName={currentFile?.name || ''}
      />
    </Card>
  );
};

export default MessagesPage;