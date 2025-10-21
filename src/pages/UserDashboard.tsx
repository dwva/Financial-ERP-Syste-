import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useNavigate } from 'react-router-dom';
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
import AddExpenseForm from '@/components/user/AddExpenseForm';
import MyExpensesTable from '@/components/user/MyExpensesTable';
import MessagesPage from '@/components/user/MessagesPage'; // Add this import
import { LogOut, Wallet, User, Calendar, Building, Hash, Camera, Mail } from 'lucide-react';

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const { employees, updateEmployee, refreshData } = useData();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [name, setName] = useState('');
  const [sector, setSector] = useState('');
  const [age, setAge] = useState('');
  const [status, setStatus] = useState<'employee' | 'founder' | 'manager' | 'intern' | 'admin'>('employee');
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);

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

  const handleLogout = () => {
    logout();
    navigate('/login');
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
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-xl">
                <Wallet className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">My Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome, {user?.email || 'User'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
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
                    <DialogTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Update Profile
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-24 w-24">
                          <AvatarImage src={profilePicture || ''} alt="Profile" />
                          <AvatarFallback className="text-2xl">
                            {name ? name.charAt(0).toUpperCase() : getUserInitials(user?.email)}
                          </AvatarFallback>
                        </Avatar>
                        <label 
                          htmlFor="profile-picture" 
                          className="absolute bottom-0 right-0 bg-primary rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors"
                        >
                          <Camera className="h-4 w-4 text-primary-foreground" />
                        </label>
                      </div>
                      <Input
                        id="profile-picture"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfilePictureChange}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => document.getElementById('profile-picture')?.click()}
                      >
                        Change Photo
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="name"
                          placeholder="Enter your name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="sector">Employee Sector</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="sector"
                          placeholder="Enter your sector"
                          value={sector}
                          onChange={(e) => setSector(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="age"
                          type="number"
                          placeholder="Enter your age"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="status">User Status</Label>
                      <Select value={status} onValueChange={(value: 'employee' | 'founder' | 'manager' | 'intern' | 'admin') => setStatus(value)}>
                        <SelectTrigger>
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
                    
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsProfileOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Update Profile</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              
              <Button onClick={handleLogout} variant="outline" className="gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="expenses" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="expenses" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              My Expenses
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Messages
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="expenses">
            <div className="space-y-6">
              <AddExpenseForm />
              <MyExpensesTable />
            </div>
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