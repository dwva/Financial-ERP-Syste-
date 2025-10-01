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
import AddExpenseForm from '@/components/user/AddExpenseForm';
import MyExpensesTable from '@/components/user/MyExpensesTable';
import { LogOut, Wallet, User, Calendar, Building, Hash } from 'lucide-react';

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const { employees, updateEmployee, refreshData } = useData();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [name, setName] = useState('');
  const [sector, setSector] = useState('');
  const [age, setAge] = useState('');
  const [status, setStatus] = useState<'employee' | 'founder' | 'manager' | 'intern' | 'admin'>('employee');

  // Get current user data
  const currentUser = employees.find(emp => emp.email === user?.email);
  
  // Initialize form with current user data
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setSector(currentUser.sector || '');
      setAge(currentUser.age?.toString() || '');
      setStatus(currentUser.status || 'employee');
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

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser) {
      try {
        await updateEmployee({
          ...currentUser,
          name,
          sector,
          age: age ? parseInt(age) : undefined,
          status
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
                      <AvatarImage src="" alt={user?.email || ''} />
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
        <div className="space-y-6">
          <AddExpenseForm />
          <MyExpensesTable />
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;