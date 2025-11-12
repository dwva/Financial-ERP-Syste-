import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'react-toastify';
import { UserPlus, Trash2, Users, User, Building, Hash, Filter, Search, Phone, Mail, Info, CheckCircle, Camera, Key } from 'lucide-react';
import { reauthenticateAsAdmin } from '@/services/firebaseService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const UserManagement = () => {
  const { employees, addEmployee, deleteEmployee, updateEmployeeStatus, refreshData } = useData();
  const { resetPassword } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUserStatus, setNewUserStatus] = useState<'employee' | 'admin'>('employee');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSector, setFilterSector] = useState<string>('all');
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<{id: string, email: string} | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [employeeToReset, setEmployeeToReset] = useState<{id: string, email: string} | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');

  // Get unique sectors from employees
  const uniqueSectors = useMemo(() => {
    const sectors = new Set<string>();
    employees.forEach(employee => {
      if (employee.sector) {
        sectors.add(employee.sector);
      }
    });
    return Array.from(sectors).sort();
  }, [employees]);

  // Get unique statuses from employees
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set<string>();
    employees.forEach(employee => {
      if (employee.status) {
        statuses.add(employee.status);
      }
    });
    return Array.from(statuses).sort();
  }, [employees]);

  // Filter employees based on search and filters
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      const matchesSearch = 
        !searchTerm ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (employee.name && employee.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (employee.sector && employee.sector.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (employee.mobile && employee.mobile.includes(searchTerm)) ||
        (employee.username && employee.username.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = 
        filterStatus === 'all' || 
        employee.status === filterStatus;
      
      const matchesSector = 
        filterSector === 'all' || 
        employee.sector === filterSector;
      
      return matchesSearch && matchesStatus && matchesSector;
    });
  }, [employees, searchTerm, filterStatus, filterSector]);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((newEmail || newUsername) && newPassword) {
      setIsAddingEmployee(true);
      try {
        // Process the email/username input
        let emailToUse = newEmail;
        
        // If email is not provided but username is, create email from username
        if (!newEmail && newUsername) {
          emailToUse = `${newUsername}@company.com`;
        }
        
        // Create the user with the appropriate status
        await addEmployee(emailToUse, newPassword, newUsername || undefined, newMobile || undefined, newUserStatus);
        
        // Show success message
        if (newUserStatus === 'admin') {
          toast.success('Admin user created successfully!');
        } else {
          toast.success('Employee added successfully!');
        }
        
        // Re-authenticate as admin to prevent redirection
        await reauthenticateAsAdmin();
        
        // Reset form fields
        setNewEmail('');
        setNewUsername('');
        setNewMobile('');
        setNewPassword('');
        setNewUserStatus('employee');
        setIsDialogOpen(false);
      } catch (error: any) {
        console.error('Error adding employee:', error);
        let errorMessage = 'Failed to add employee. Please try again.';
        
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'An account with this email already exists.';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Invalid email format.';
        } else if (error.code === 'auth/weak-password') {
          errorMessage = 'Password should be at least 6 characters.';
        } else if (error.message && error.message.includes('email-already-in-use')) {
          errorMessage = 'An account with this email already exists.';
        }
        
        toast.error(errorMessage);
      } finally {
        setIsAddingEmployee(false);
      }
    }
  };

  const handleDeleteEmployee = (id: string, email: string) => {
    // Allow deletion of sub-admins but prevent deletion of main admins
    if (email === 'admin@company.com' || email === 'adminxyz@gmail.com') {
      toast.error('Cannot delete main admin users');
      return;
    }
    setEmployeeToDelete({id, email});
    setDeleteDialogOpen(true);
  };

  const confirmDeleteEmployee = async () => {
    if (employeeToDelete) {
      try {
        await deleteEmployee(employeeToDelete.id);
        toast.success('Employee deleted successfully!');
      } catch (error) {
        console.error('Error deleting employee:', error);
        toast.error('Failed to delete employee. Please try again.');
      } finally {
        setDeleteDialogOpen(false);
        setEmployeeToDelete(null);
      }
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'founder':
        return <Badge className="bg-purple-500">Founder</Badge>;
      case 'manager':
        return <Badge className="bg-blue-500">Manager</Badge>;
      case 'intern':
        return <Badge className="bg-yellow-500">Intern</Badge>;
      case 'admin':
        return <Badge className="bg-red-500">Admin</Badge>;
      default:
        return <Badge className="bg-gray-500">Employee</Badge>;
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterSector('all');
  };

  const getUserInitials = (name: string | undefined, email: string) => {
    if (name && name.trim() !== '') {
      return name.substring(0, 2).toUpperCase();
    }
    const [emailName] = email.split('@');
    return emailName.substring(0, 2).toUpperCase();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmployees(filteredEmployees.map(emp => emp.id));
    } else {
      setSelectedEmployees([]);
    }
  };

  const handleSelectEmployee = (employeeId: string, checked: boolean) => {
    if (checked) {
      setSelectedEmployees(prev => [...prev, employeeId]);
    } else {
      setSelectedEmployees(prev => prev.filter(id => id !== employeeId));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEmployees.length === 0) return;
    
    try {
      // Filter out main admins from selected employees
      const employeesToDelete = selectedEmployees.filter(id => {
        const employee = employees.find(emp => emp.id === id);
        return employee && 
               employee.email !== 'admin@company.com' && 
               employee.email !== 'adminxyz@gmail.com';
      });
      
      const mainAdmins = selectedEmployees.filter(id => {
        const employee = employees.find(emp => emp.id === id);
        return employee && 
               (employee.email === 'admin@company.com' || 
                employee.email === 'adminxyz@gmail.com');
      });
      
      if (mainAdmins.length > 0) {
        toast.error('Cannot delete main admin users');
      }
      
      for (const employeeId of employeesToDelete) {
        await deleteEmployee(employeeId);
      }
      
      toast.success(`${employeesToDelete.length} employee(s) deleted successfully!`);
      setSelectedEmployees([]);
    } catch (error) {
      console.error('Error deleting employees:', error);
      toast.error('Failed to delete employees. Please try again.');
    }
  };

  // Add function to handle reset password
  const handleResetPassword = (id: string, email: string) => {
    setEmployeeToReset({id, email});
    setResetPasswordValue(''); // Reset the password input
    setResetPasswordDialogOpen(true);
  };

  // Add function to confirm reset password
  const confirmResetPassword = async () => {
    if (employeeToReset && resetPasswordValue) {
      try {
        // Reset the password in the database
        await resetPassword(employeeToReset.email, resetPasswordValue);
        toast.success('Password reset successfully!');
      } catch (error) {
        console.error('Error resetting password:', error);
        toast.error('Failed to reset password. Please try again.');
      } finally {
        setResetPasswordDialogOpen(false);
        setEmployeeToReset(null);
        setResetPasswordValue('');
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage employee accounts</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedEmployees.length > 0 && (
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete ({selectedEmployees.length})
                </Button>
              )}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <UserPlus className="w-4 h-4" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md md:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                      Enter the user details below. Username will be stored separately and not appended with @company.com
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddEmployee} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-username">Username</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="new-username"
                            type="text"
                            placeholder="Enter username"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-email">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="new-email"
                            type="email"
                            placeholder="user@company.com"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-mobile">Mobile Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="new-mobile"
                            type="tel"
                            placeholder="Enter mobile number"
                            value={newMobile}
                            onChange={(e) => setNewMobile(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          placeholder="Enter password (min. 6 characters)"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new-status">User Status</Label>
                      <Select value={newUserStatus} onValueChange={(value: 'employee' | 'admin') => setNewUserStatus(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select user status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="admin">Admin (Full Access)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="bg-green-50 p-3 rounded-md border border-green-200">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-green-800">No Automatic Redirection</p>
                          <p className="text-sm text-green-700 mt-1">
                            After creating a user, you will remain on this page. The new user must log in separately using their credentials.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <Button type="submit" className="flex-1" disabled={isAddingEmployee}>
                        {isAddingEmployee ? 'Adding User...' : 'Add User'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsDialogOpen(false)} 
                        disabled={isAddingEmployee}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Filter Section */}
          <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="w-40">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {uniqueStatuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-40">
              <Select value={filterSector} onValueChange={setFilterSector}>
                <SelectTrigger>
                  <SelectValue placeholder="All sectors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sectors</SelectItem>
                  {uniqueSectors.map(sector => (
                    <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center">
              <Button variant="outline" onClick={clearFilters} className="gap-2">
                <Filter className="w-4 h-4" />
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Profile</TableHead>
                  <TableHead className="whitespace-nowrap">Employee ID</TableHead>
                  <TableHead className="whitespace-nowrap">Name</TableHead>
                  <TableHead className="whitespace-nowrap">Username</TableHead>
                  <TableHead className="whitespace-nowrap">Email</TableHead>
                  <TableHead className="whitespace-nowrap">Mobile</TableHead>
                  <TableHead className="whitespace-nowrap">Sector</TableHead>
                  <TableHead className="whitespace-nowrap">Age</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => {
                  const isSelected = selectedEmployees.includes(employee.id);
                  return (
                    <TableRow key={employee.id} className={isSelected ? 'bg-muted' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectEmployee(employee.id, checked as boolean)}
                          disabled={employee.email === 'admin@company.com' || 
                                  employee.email === 'adminxyz@gmail.com'}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={employee.profilePicture || ''} alt={employee.name || employee.email} />
                          <AvatarFallback>
                            {getUserInitials(employee.name, employee.email)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">{employee.id.substring(0, 8)}...</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          {employee.name || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{employee.username || 'N/A'}</TableCell>
                      <TableCell className="whitespace-nowrap">{employee.email}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          {employee.mobile || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-muted-foreground" />
                          {employee.sector || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4 text-muted-foreground" />
                          {employee.age || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{getStatusBadge(employee.status)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetPassword(employee.id, employee.email)}
                            className="gap-2"
                          >
                            <Key className="w-4 h-4" />
                            <span className="hidden sm:inline">Reset</span>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteEmployee(employee.id, employee.email)}
                            className="gap-2"
                            disabled={employee.email === 'admin@company.com' || 
                                      employee.email === 'adminxyz@gmail.com'}
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the employee account and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteEmployee} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Reset Password Dialog */}
      <AlertDialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a new password for {employeeToReset?.email}. The user will be required to change this password on their next login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="reset-password" className="block mb-2">New Password</Label>
            <Input
              id="reset-password"
              type="password"
              value={resetPasswordValue}
              onChange={(e) => setResetPasswordValue(e.target.value)}
              placeholder="Enter new password"
              minLength={6}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmResetPassword} 
              className="bg-primary hover:bg-primary/90"
              disabled={!resetPasswordValue || resetPasswordValue.length < 6}
            >
              Reset Password
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default UserManagement;