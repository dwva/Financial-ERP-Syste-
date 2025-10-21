import { useState } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, CheckCircle, Clock, Receipt, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const NotificationPage = () => {
  try {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
    const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
    const [selectedDate, setSelectedDate] = useState<string>('__all_dates__');
    const [selectedMonth, setSelectedMonth] = useState<string>('__all_months__');

    // Get unique months from notifications
    const uniqueMonths = [...new Set(notifications.map(notification => {
      try {
        const date = notification.timestamp instanceof Date ? notification.timestamp : new Date(notification.timestamp);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      } catch (error) {
        console.error('Error processing notification timestamp for months:', error);
        return 'Unknown';
      }
    }))].filter(month => month !== 'Unknown').sort();

    // Get unique dates from notifications
    const uniqueDates = [...new Set(notifications.map(notification => {
      try {
        const date = notification.timestamp instanceof Date ? notification.timestamp : new Date(notification.timestamp);
        return date.toISOString().split('T')[0]; // YYYY-MM-DD format
      } catch (error) {
        console.error('Error processing notification timestamp for dates:', error);
        return 'Unknown';
      }
    }))].filter(date => date !== 'Unknown').sort().reverse();

    const filteredNotifications = notifications.filter(notification => {
      try {
        // Apply read/unread filter
        if (filter === 'unread' && notification.read) return false;
        if (filter === 'read' && !notification.read) return false;
        
        // Apply date filter
        if (selectedDate && selectedDate !== '__all_dates__') {
          const notificationDate = notification.timestamp instanceof Date 
            ? notification.timestamp 
            : new Date(notification.timestamp);
          if (notificationDate.toISOString().split('T')[0] !== selectedDate) return false;
        }
        
        // Apply month filter
        if (selectedMonth && selectedMonth !== '__all_months__') {
          const notificationDate = notification.timestamp instanceof Date 
            ? notification.timestamp 
            : new Date(notification.timestamp);
          const notificationMonth = notificationDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
          if (notificationMonth !== selectedMonth) return false;
        }
        
        return true;
      } catch (error) {
        console.error('Error filtering notification:', error);
        return false;
      }
    });

    const formatTimeAgo = (date: Date) => {
      try {
        const now = new Date();
        // Ensure we're working with a valid Date object
        const notificationDate = date instanceof Date ? date : new Date(date);
        const diffInMs = now.getTime() - notificationDate.getTime();
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInDays > 0) {
          return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
        } else if (diffInHours > 0) {
          return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        } else {
          return 'Just now';
        }
      } catch (error) {
        console.error('Error formatting time ago:', error);
        return 'Unknown time';
      }
    };

    const getNotificationIcon = (type: string) => {
      switch (type) {
        case 'expense_added':
          return <Receipt className="w-4 h-4" />;
        case 'expense_updated':
          return <Receipt className="w-4 h-4" />;
        default:
          return <Bell className="w-4 h-4" />;
      }
    };

    const getNotificationColor = (type: string) => {
      switch (type) {
        case 'expense_added':
          return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'expense_updated':
          return 'bg-green-100 text-green-800 border-green-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    const clearFilters = () => {
      setSelectedDate('__all_dates__');
      setSelectedMonth('__all_months__');
      setFilter('all');
    };

    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Bell className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>
                    {unreadCount > 0 
                      ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` 
                      : 'No unread notifications'}
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark All Read
                </Button>
              </div>
            </div>
            
            {/* Filter Section */}
            <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
              {/* Read/Unread Filter */}
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilter('all')}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  variant={filter === 'unread' ? 'default' : 'outline'}
                  onClick={() => setFilter('unread')}
                  size="sm"
                  className={unreadCount > 0 ? 'relative' : ''}
                >
                  Unread
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center p-0">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant={filter === 'read' ? 'default' : 'outline'}
                  onClick={() => setFilter('read')}
                  size="sm"
                >
                  Read
                </Button>
              </div>
              
              {/* Date Filter */}
              <div className="w-40">
                <Select value={selectedDate || ''} onValueChange={setSelectedDate}>
                  <SelectTrigger>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter by date" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all_dates__">All dates</SelectItem>
                    {uniqueDates
                      .filter(date => date && date !== 'Unknown') // Filter out invalid dates
                      .map(date => (
                        <SelectItem key={date} value={date}>
                          {new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Month Filter */}
              <div className="w-40">
                <Select value={selectedMonth || ''} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter by month" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all_months__">All months</SelectItem>
                    {uniqueMonths
                      .filter(month => month && month !== 'Unknown') // Filter out invalid months
                      .map(month => (
                        <SelectItem key={month} value={month}>{month}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters Button */}
              <Button variant="outline" onClick={clearFilters} className="gap-2">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-250px)]">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <BellOff className="w-12 h-12 mb-4" />
                <p className="text-lg">No notifications found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border transition-all ${
                      notification.read 
                        ? 'bg-muted/50 border-muted' 
                        : 'bg-background border-primary/20 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h3 className="font-medium">{notification.title}</h3>
                          {!notification.read && (
                            <Badge className="bg-primary text-primary-foreground">
                              <Clock className="w-3 h-3 mr-1" />
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatTimeAgo(notification.timestamp)}
                        </p>
                      </div>
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="h-8 w-8 p-0"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    );
  } catch (error) {
    console.error('Error rendering NotificationPage:', error);
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Error loading notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <BellOff className="w-12 h-12 mb-4" />
            <p className="text-lg">Unable to load notifications</p>
            <p className="text-sm">Please try refreshing the page</p>
          </div>
        </CardContent>
      </Card>
    );
  }
};

export default NotificationPage;