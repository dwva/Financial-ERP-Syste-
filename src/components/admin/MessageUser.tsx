import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Message } from '@/services/messageService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Send, RefreshCw, FileText, Clock, Download, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { downloadLocalFile } from '@/services/messageFileService';

const MessageUser = () => {
  const { employees, sendMessage, messages, loading: dataLoading, deleteMessage } = useData(); // Add deleteMessage
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [indexError, setIndexError] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [messageToDelete, setMessageToDelete] = useState<{ id: string; subject: string } | null>(null);

  // Filter messages to show only those sent by the current admin
  useEffect(() => {
    if (messages.length > 0 && user?.email) {
      const adminMessages = messages.filter(msg => msg.senderId === user.email);
      setSentMessages(adminMessages);
      setInitialLoading(false);
    }
  }, [messages, user]);

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
      await deleteMessage(messageToDelete.id); // This should now be available
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

  // Wrapper function for refresh button onClick
  const handleRefreshClick = () => {
    setRefreshing(!refreshing); // Simple refresh toggle
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleSend = async () => {
    if (!selectedUser) {
      toast.error('Please select a user');
      return;
    }

    if (!subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }

    if (!content.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to send messages');
      return;
    }

    setLoading(true);
    try {
      const receiver = employees.find(emp => emp.email === selectedUser);
      if (!receiver) {
        toast.error('Selected user not found');
        setLoading(false);
        return;
      }

      // Validate that the receiver is a valid user (not admin)
      const isValidRecipient = receiver.status === 'employee' || 
                              receiver.status === 'founder' || 
                              receiver.status === 'manager' || 
                              receiver.status === 'intern' || 
                              !receiver.status; // Default to employee if no status
      
      if (!isValidRecipient) {
        toast.error('Cannot send message to this user');
        setLoading(false);
        return;
      }

      // Log file information for debugging
      if (file) {
        console.log('Sending file:', {
          name: file.name,
          size: file.size,
          type: file.type
        });
      }

      // Prepare the message data (note: file handling is done in the DataContext)
      const messageData = {
        senderId: user.email,
        senderName: user.email, // Use email as sender name since displayName is not available
        receiverId: selectedUser,
        receiverName: receiver.name || receiver.email,
        subject,
        content,
        read: false // Add the read property here
      };

      console.log('About to send message:', messageData);

      // Send the message with file if provided
      const result = await sendMessage(messageData, file || undefined);

      console.log('Message sent result:', result);
      console.log('Message ID:', result.id);

      toast.success('Message sent successfully!');
      
      // Reset form
      setSelectedUser('');
      setSubject('');
      setContent('');
      setFile(null);
      setFileName('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      console.error('Error stack:', error.stack);
      
      // Handle specific error cases
      if (error.message && error.message.includes('File upload failed')) {
        // Show a more informative error message
        toast.error(`File upload failed: ${error.message}. The message was not sent.`);
      } else {
        const errorMessage = error.message || error.toString() || 'Failed to send message. Please try again.';
        toast.error(`Failed to send message: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return 'Unknown';
    try {
      // Handle Firebase Timestamp objects
      if (timestamp.toDate) {
        const date = timestamp.toDate();
        return date.toLocaleString();
      }
      // Handle regular Date objects
      else if (timestamp instanceof Date) {
        return timestamp.toLocaleString();
      }
      // Handle string timestamps
      else if (typeof timestamp === 'string') {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          return date.toLocaleString();
        }
      }
      // Handle number timestamps (Unix timestamps)
      else if (typeof timestamp === 'number') {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          return date.toLocaleString();
        }
      }
      return 'Unknown';
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'Unknown';
    }
  };

  // Function to download a file
  const handleDownloadFile = (fileUrl: string, fileName: string) => {
    // Check if this is a local file URL
    if (fileUrl.startsWith('localfile://')) {
      // Extract file ID from the URL
      const fileId = fileUrl.split('://')[1].split('/')[0];
      downloadLocalFile(fileId, fileName);
    } else {
      // For Firebase URLs, create a temporary link
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Message Users</CardTitle>
        <CardDescription>Send messages and files to specific users</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Remove the storage toggle component */}
        {/* <StorageToggle /> */}
        
        <Tabs defaultValue="compose" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="compose">Compose Message</TabsTrigger>
            <TabsTrigger value="history">Message History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="compose">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="user">Select User *</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees
                      .filter(emp => emp.email !== user?.email && emp.status !== 'admin')
                      .map(employee => (
                        <SelectItem key={employee.email} value={employee.email}>
                          {employee.name || employee.email}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="Enter message subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Message *</Label>
                <Textarea
                  id="content"
                  placeholder="Enter your message"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Attach File (Optional)</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                />
                {fileName && (
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm">{fileName}</span>
                      {file && <span className="text-xs text-muted-foreground">({formatFileSize(file.size)})</span>}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFile(null);
                        setFileName('');
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button onClick={handleSend} disabled={loading}>
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? 'Sending...' : 'Send Message'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleRefreshClick}
                  disabled={loading || refreshing}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

            </div>
          </TabsContent>
          
          <TabsContent value="history">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Sent Messages</h3>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setRefreshing(!refreshing)} // Simple refresh toggle
                    disabled={dataLoading || refreshing}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${dataLoading || refreshing ? 'animate-spin' : ''}`} />
                    {dataLoading || refreshing ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </div>
              </div>
              
              {initialLoading ? (
                <div className="text-center py-8">
                  <div className="flex justify-center mb-4">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                  <p>Loading message history...</p>
                </div>
              ) : indexError ? (
                <div className="text-center py-8">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
                    <div className="flex justify-center mb-4">
                      <div className="bg-blue-100 p-3 rounded-full">
                        <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                      </div>
                    </div>
                    <h3 className="text-lg font-medium text-blue-800 mb-2">Setting up message history</h3>
                    <p className="text-blue-700 mb-4">
                      We're creating an index to optimize your message history performance. This is a one-time setup that may take a few moments.
                    </p>
                    <p className="text-blue-600 text-sm mb-4">
                      Please wait or try refreshing the page in a minute.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={handleRefreshClick}
                      disabled={refreshing}
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      {refreshing ? 'Refreshing...' : 'Refresh Now'}
                    </Button>
                  </div>
                </div>
              ) : sentMessages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No messages sent yet</p>
                  <p className="text-sm mt-2">Send a message to see it appear in your history</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>To</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>File</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sentMessages.map((message) => (
                        <TableRow key={message.id}>
                          <TableCell className="font-medium">
                            {message.receiverName}
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
                            {/* Debug information */}
                            {process.env.NODE_ENV === 'development' && message.fileName && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Debug: fileUrl={message.fileUrl ? 'present' : 'missing'}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMessage(message.id!, message.subject)}
                              disabled={loading}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

            </div>
          </TabsContent>
        </Tabs>
        
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

export default MessageUser;