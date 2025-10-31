import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-toastify';
import { UserPlus, Trash2, Users, User, Building, Hash, Filter, Search, Briefcase } from 'lucide-react';

const StaffManagement = () => {
  const { employees, addEmployee, deleteEmployee, updateEmployeeStatus, refreshData } = useData();
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newSector, setNewSector] = useState('');
  const [newAge, setNewAge] = useState('');
  const [newStatus, setNewStatus] = useState<'employee' | 'manager' | 'intern' | 'founder'>('employee');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSector, setFilterSector] = useState<string>('all');
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<{id: string, email: string} | null>(null);

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
        (employee.sector && employee.sector.toLowerCase().includes(searchTerm.toLowerCase()));
      
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
    if (newEmail && newPassword) {
      setIsAddingEmployee(true);
      try {
        // Create the user ONLY in Firestore (no Firebase Authentication)
        await addEmployee(newEmail, newPassword, newName, newSector);
        
        // Close the dialog immediately
        setIsDialogOpen(false);
        
        // Show success message
        toast.success('Employee added successfully! Employee will need to reset their password on first login.');
        
        // Reset form
        setNewName('');
        setNewEmail('');
        setNewPassword('');
        setNewSector('');
        setNewAge('');
        setNewStatus('employee');
        
        // Refresh data to show the new employee
        setTimeout(async () => {
          await refreshData();
          
          // Find the newly created employee and update their status
          setTimeout(async () => {
            await refreshData(); // Refresh again to get the latest data
            const currentEmployees = [...employees]; // Create a copy to avoid reference issues
            const newEmployee = currentEmployees.find(emp => emp.email === newEmail);
            if (newEmployee) {
              // Convert status to either 'employee' or 'admin' for the updateEmployeeStatus function
              const statusToUpdate = newStatus === 'founder' || newStatus === 'manager' ? 'admin' : 'employee';
              await updateEmployeeStatus(newEmployee.id, statusToUpdate);
              // Refresh data again to show the updated status
              await refreshData();
            }
          }, 500);
        }, 500);
      } catch (error: any) {
        console.error('Error adding employee:', error);
        
        let errorMessage = 'Failed to add employee. Please try again.';
        
        toast.error(errorMessage);
      } finally {
        setIsAddingEmployee(false);
      }
    }
  };

  const handleDeleteEmployee = (id: string, email: string) => {
    if (email === 'admin@company.com' || email === 'user@company.com' || 
        email === 'adminxyz@gmail.com') {
      toast.error('Cannot delete admin users');
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

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Staff Management</CardTitle>
                <CardDescription>Manage company staff and their details</CardDescription>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  Add Staff
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Staff</DialogTitle>
                  <DialogDescription>Enter the details for the new staff member</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddEmployee} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-name">Full Name</Label>
                    <Input
                      id="new-name"
                      type="text"
                      placeholder="John Doe"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-email">Email Address</Label>
                    <Input
                      id="new-email"
                      type="email"
                      placeholder="user@company.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      required
                    />
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-sector">Sector</Label>
                      <Input
                        id="new-sector"
                        type="text"
                        placeholder="Finance"
                        value={newSector}
                        onChange={(e) => setNewSector(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-age">Age</Label>
                      <Input
                        id="new-age"
                        type="number"
                        placeholder="25"
                        value={newAge}
                        onChange={(e) => setNewAge(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-status">Staff Status</Label>
                    <Select value={newStatus} onValueChange={(value: 'employee' | 'manager' | 'intern' | 'founder') => setNewStatus(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select staff status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="intern">Intern</SelectItem>
                        <SelectItem value="founder">Founder</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" disabled={isAddingEmployee}>
                      {isAddingEmployee ? 'Adding Staff...' : 'Add Staff'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isAddingEmployee}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Filter Section */}
          <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search staff..."
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      {employee.name || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      {employee.sector || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-muted-foreground" />
                      {employee.age || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(employee.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteEmployee(employee.id, employee.email)}
                      className="gap-2"
                      disabled={employee.email === 'admin@company.com' || 
                                employee.email === 'user@company.com' || 
                                employee.email === 'adminxyz@gmail.com'}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the staff member account and all associated data.
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
    </Card>
  );
};

export default StaffManagement;