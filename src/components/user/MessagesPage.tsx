import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Message } from '@/services/messageService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileText, Mail, MailOpen, Clock, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

const MessagesPage = () => {
  const { getUserMessages, markMessageAsRead, getAllMessages } = useData();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Get user's messages
  const fetchMessages = async () => {
    if (user?.email) {
      try {
        setLoading(true);
        console.log('Fetching messages for user with email:', user.email);
        
        // First try the Firebase query
        let userMessages = [];
        try {
          userMessages = await getUserMessages(user.email);
          console.log('Fetched messages using Firebase query:', userMessages);
        } catch (queryError: any) {
          console.log('Firebase query failed, falling back to client-side filtering');
          // If Firebase query fails due to index requirements, fall back to client-side filtering
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MessagesPage;