import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useNotification } from '@/contexts/NotificationContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import AddExpenseForm from '@/components/user/AddExpenseForm';
import MyExpensesTable from '@/components/user/MyExpensesTable';
import MessagesPage from '@/components/user/MessagesPage';
import OverdueExpenses from '@/components/user/OverdueExpenses';
import { Bell, LogOut, Wallet, User, Calendar, Building, Hash, Camera, Mail, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const { employees, updateEmployee, refreshData, messages, getUnreadMessageCount } = useData();
  const { unreadCount } = useNotification();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [name, setName] = useState('');
  const [sector, setSector] = useState('');
  const [age, setAge] = useState('');
  const [status, setStatus] = useState<'employee' | 'founder' | 'manager' | 'intern' | 'admin'>('employee');
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState<number>(0);

  // Get current user data
  const currentUser = employees.find(emp => emp.email === user?.email);
  
  // Initialize form with current user data
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setSector(currentUser.sector || '');
      setAge(currentUser.age?.toString() || '');
      setStatus(currentUser.status || 'employee');
      setProfilePicture(currentUser.profilePicture || '');
    }
  }, [currentUser]);

  // Refresh data when component mounts
  useEffect(() => {
    refreshData();
  }, []);

  // Calculate unread message count for the current user
  useEffect(() => {
    if (user?.email) {
      const count = getUnreadMessageCount(user.email);
      setUnreadMessageCount(count);
    }
  }, [user?.email, messages, getUnreadMessageCount]);

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation is now handled by ProtectedRoute component
      // No need to manually navigate to /login
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const handleNotificationClick = () => {
    // For user dashboard, we'll switch to the messages tab since that's where notifications are
    const messagesTab = document.querySelector('[value="messages"]');
    if (messagesTab) {
      (messagesTab as HTMLButtonElement).click();
    }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePictureFile(file);
      
      // Preview the image
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfilePicture(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser) {
      try {
        // For now, we'll just store the image as a base64 string
        // In a production app, you would upload to a storage service like Firebase Storage
        await updateEmployee({
          ...currentUser,
          name,
          sector,
          age: age ? parseInt(age) : undefined,
          status,
          profilePicture
        });
        setIsProfileOpen(false);
      } catch (error) {
        console.error('Error updating profile:', error);
      }
    }
  };

  const getUserInitials = (email: string | null) => {
    if (!email) return 'U';
    const [name] = email.split('@');
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="border-b bg-card fixed top-0 left-0 right-0 h-16 z-30">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-xl">
              <Wallet className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold">My Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Profile Avatar */}
            <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profilePicture || ''} alt={user?.email || ''} />
                    <AvatarFallback>{getUserInitials(user?.email)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5" />
                    Update Profile
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={profilePicture || ''} alt="Profile" />
                        <AvatarFallback className="text-xl">
                          {name ? name.charAt(0).toUpperCase() : getUserInitials(user?.email)}
                        </AvatarFallback>
                      </Avatar>
                      <label 
                        htmlFor="profile-picture" 
                        className="absolute bottom-0 right-0 bg-primary rounded-full p-1.5 cursor-pointer hover:bg-primary/90 transition-colors"
                      >
                        <Camera className="h-4 w-4 text-primary-foreground" />
                      </label>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      className="h-10 text-sm"
                      onClick={() => document.getElementById('profile-picture')?.click()}
                    >
                      Change Photo
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm">Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10 text-sm h-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sector" className="text-sm">Employee Sector</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="sector"
                        placeholder="Enter your sector"
                        value={sector}
                        onChange={(e) => setSector(e.target.value)}
                        className="pl-10 text-sm h-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="age" className="text-sm">Age</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="age"
                        type="number"
                        placeholder="Enter your age"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="pl-10 text-sm h-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-sm">User Status</Label>
                    <Select value={status} onValueChange={(value: 'employee' | 'founder' | 'manager' | 'intern' | 'admin') => setStatus(value)}>
                      <SelectTrigger className="text-sm h-10">
                        <SelectValue placeholder="Select user status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="founder">Founder</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="intern">Intern</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-end gap-2">
                    <Button type="button" variant="outline" className="h-10" onClick={() => setIsProfileOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="h-10">Update Profile</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            
            {/* Logout Button */}
            <Button onClick={handleLogout} variant="outline" className="h-10 gap-1 px-3 text-sm">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content with padding to account for fixed navbar */}
      <main className="container mx-auto px-4 pt-16 pb-8">
        <Tabs defaultValue="expenses" className="w-full mt-6">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
            <TabsTrigger value="expenses" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">My Expenses</span>
              <span className="sm:hidden">Expenses</span>
            </TabsTrigger>
            <TabsTrigger value="overdue" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">Overdue Expenses</span>
              <span className="sm:hidden">Overdue</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2 relative">
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Messages</span>
              <span className="sm:hidden">Msg</span>
              {unreadMessageCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {unreadMessageCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="expenses">
            <div className="space-y-6">
              <AddExpenseForm />
              <MyExpensesTable />
            </div>
          </TabsContent>
          
          <TabsContent value="overdue">
            <OverdueExpenses />
          </TabsContent>
          
          <TabsContent value="messages">
            <MessagesPage />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default UserDashboard;