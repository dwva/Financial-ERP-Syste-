import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-toastify';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Message } from '@/services/messageService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Send, FileText, RefreshCw, Clock } from 'lucide-react';

const MessageUser = () => {
  const { employees, sendMessage, getAdminMessages, getAllMessages } = useData();
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Get all messages for debugging (temporary function)
  const fetchAllMessagesForDebug = async () => {
    try {
      console.log('Fetching all messages for debugging...');
      const allMessages = await getAllMessages();
      
      console.log('All messages in database:');
      allMessages.forEach((msg: any, index: number) => {
        console.log(`Message ${index + 1}:`, { 
          id: msg.id, 
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          subject: msg.subject,
          timestamp: msg.timestamp?.toDate ? msg.timestamp.toDate() : msg.timestamp
        });
      });
      
      // Filter messages sent by current admin
      const adminMessages = allMessages.filter((msg: any) => msg.senderId === user?.email);
      console.log('Messages sent by current admin (client-side filter):', adminMessages);
      
      return allMessages;
    } catch (error) {
      console.error('Error fetching all messages for debug:', error);
      return [];
    }
  };

  // Get admin's sent messages with retry mechanism
  const fetchSentMessages = async (retryCount = 3) => {
    if (user?.email) {
      try {
        setRefreshing(true);
        console.log('Fetching messages for admin with email:', user.email);
        
        // First try the Firebase query
        let messages = [];
        try {
          messages = await getAdminMessages(user.email);
          console.log('Fetched messages using Firebase query:', messages);
        } catch (queryError) {
          console.log('Firebase query failed, falling back to client-side filtering');
          // If Firebase query fails due to index requirements, fall back to client-side filtering
          const allMessages = await getAllMessages();
          messages = allMessages.filter((msg: any) => msg.senderId === user.email);
          console.log('Fetched messages using client-side filtering:', messages);
        }
        
        console.log('Number of messages fetched:', messages.length);
        
        // Log details of each message for debugging
        messages.forEach((msg: any, index: number) => {
          console.log(`Message ${index + 1}:`, {
            id: msg.id,
            senderId: msg.senderId,
            receiverId: msg.receiverId,
            subject: msg.subject,
            timestamp: msg.timestamp?.toDate ? msg.timestamp.toDate() : msg.timestamp
          });
        });
        
        setSentMessages(messages);
        
        // Show success message if messages were fetched
        if (messages.length > 0) {
          console.log(`Successfully loaded ${messages.length} messages`);
        } else {
          console.log('No messages found for this admin');
        }
      } catch (error: any) {
        console.error('Error fetching sent messages:', error);
        
        // Handle index creation message
        if (error.message && error.message.includes('query requires an index')) {
          toast.info('Setting up message history for the first time. This may take a moment.');
          // Retry after a short delay to allow index creation
          if (retryCount > 0) {
            setTimeout(() => {
              fetchSentMessages(retryCount - 1);
            }, 2000);
            return;
          }
        }
        
        // Retry mechanism for other errors
        if (retryCount > 0 && !error.message?.includes('query requires an index')) {
          console.log(`Retrying... (${retryCount} attempts left)`);
          setTimeout(() => {
            fetchSentMessages(retryCount - 1);
          }, 1000);
          return;
        }
        
        // Provide more detailed error message to user
        const errorMessage = error.message || 'Failed to load message history. Please try again.';
        toast.error(errorMessage);
      } finally {
        setRefreshing(false);
      }
    }
  };

  // Wrapper function for refresh button onClick
  const handleRefreshClick = () => {
    fetchSentMessages();
  };

  // Initialize component and fetch messages
  useEffect(() => {
    // Show initial loading message
    toast.info('Loading message history...', { autoClose: 1000 });
    fetchSentMessages();
  }, [user, getAdminMessages]);

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

      // Send the message
      const result = await sendMessage({
        senderId: user.email,
        senderName: user.email, // Use email as sender name since displayName is not available
        receiverId: selectedUser,
        receiverName: receiver.name || receiver.email,
        subject,
        content,
        read: false
      }, file || undefined);

      console.log('Message sent result:', result);

      toast.success('Message sent successfully!');
      
      // Refresh message history to include the new message
      await fetchSentMessages();
      
      // Reset form
      setSelectedUser('');
      setSubject('');
      setContent('');
      setFile(null);
      setFileName('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage = error.message || error.toString() || 'Failed to send message. Please try again.';
      toast.error(`Failed to send message: ${errorMessage}`);
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
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return 'Unknown';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Message Users</CardTitle>
        <CardDescription>Send messages and files to specific users</CardDescription>
      </CardHeader>
      <CardContent>
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefreshClick}
                  disabled={refreshing}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
              </div>
              {sentMessages.length === 0 ? (
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
                                  <a 
                                    href={message.fileUrl} 
                                    download={message.fileName}
                                    className="ml-2 text-blue-600 hover:underline"
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MessageUser;