import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Receipt, FileText, Image as ImageIcon, Search, ArrowUpDown, Filter, Trash2, PlusCircle, Edit, Eye, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Add this interface for the expense form
interface ExpenseForm {
  userId: string;
  amount: string;
  description: string;
  date: string;
  company: string;
  sector: string;
}

type SortField = 'employee' | 'amount' | 'date' | 'description';
type SortOrder = 'asc' | 'desc';

const AllExpensesTableEnhanced = () => {
  const { expenses, employees, deleteExpense, addExpense } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmployee, setFilterEmployee] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [isAddExpenseDialogOpen, setIsAddExpenseDialogOpen] = useState(false);
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [isViewExpenseDialogOpen, setIsViewExpenseDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [expandedCompanies, setExpandedCompanies] = useState<Record<string, boolean>>({});
  const [newExpense, setNewExpense] = useState<ExpenseForm>({
    userId: '',
    amount: '',
    description: '',
    date: '',
    company: '',
    sector: ''
  });

  // Get unique months and years from expenses
  const uniqueMonths = useMemo(() => {
    const months = new Set<string>();
    expenses.forEach(expense => {
      const date = new Date(expense.timestamp);
      const month = date.toLocaleDateString('en-US', { month: 'long' });
      months.add(month);
    });
    return Array.from(months).sort();
  }, [expenses]);

  const uniqueYears = useMemo(() => {
    const years = new Set<string>();
    expenses.forEach(expense => {
      const date = new Date(expense.timestamp);
      const year = date.getFullYear().toString();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [expenses]);

  const filteredAndSortedExpenses = useMemo(() => {
    let filtered = [...expenses];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (expense) =>
          expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          expense.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          expense.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          expense.sector?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by employee
    if (filterEmployee !== 'all') {
      filtered = filtered.filter((expense) => expense.userId === filterEmployee);
    }

    // Filter by month
    if (filterMonth !== 'all') {
      filtered = filtered.filter((expense) => {
        const expenseMonth = new Date(expense.timestamp).toLocaleDateString('en-US', { month: 'long' });
        return expenseMonth === filterMonth;
      });
    }

    // Filter by year
    if (filterYear !== 'all') {
      filtered = filtered.filter((expense) => {
        const expenseYear = new Date(expense.timestamp).getFullYear().toString();
        return expenseYear === filterYear;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'employee':
          comparison = a.userId.localeCompare(b.userId);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'date':
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
        case 'description':
          comparison = a.description.localeCompare(b.description);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [expenses, searchTerm, filterEmployee, filterMonth, filterYear, sortField, sortOrder]);

  // Group expenses by company
  const groupedExpenses = useMemo(() => {
    const groups: Record<string, any[]> = {};
    
    filteredAndSortedExpenses.forEach(expense => {
      const company = expense.company || 'Unknown Company';
      if (!groups[company]) {
        groups[company] = [];
      }
      groups[company].push(expense);
    });
    
    return groups;
  }, [filteredAndSortedExpenses]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const toggleCompanyExpansion = (company: string) => {
    setExpandedCompanies(prev => ({
      ...prev,
      [company]: !prev[company]
    }));
  };

  const getFileIcon = (fileName: string | null) => {
    if (!fileName) return <FileText className="w-4 h-4" />;
    if (fileName.match(/\.(jpg|jpeg|png|gif)$/i)) return <ImageIcon className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const totalAmount = filteredAndSortedExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterEmployee('all');
    setFilterMonth('all');
    setFilterYear('all');
  };

  const handleDeleteClick = (expenseId: string) => {
    setExpenseToDelete(expenseId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (expenseToDelete) {
      try {
        await deleteExpense(expenseToDelete);
        toast.success('Expense deleted successfully!');
      } catch (error) {
        console.error('Error deleting expense:', error);
        toast.error('Failed to delete expense. Please try again.');
      } finally {
        setDeleteDialogOpen(false);
        setExpenseToDelete(null);
      }
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.userId || !newExpense.amount || !newExpense.description || !newExpense.date) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      const expenseData = {
        userId: newExpense.userId,
        amount: parseFloat(newExpense.amount),
        description: newExpense.description,
        file: null,
        fileName: null,
        date: newExpense.date,
        company: newExpense.company || '',
        sector: newExpense.sector || '',
        timestamp: new Date().toISOString()
      };
      
      await addExpense(expenseData);
      setIsAddExpenseDialogOpen(false);
      setNewExpense({
        userId: '',
        amount: '',
        description: '',
        date: '',
        company: '',
        sector: ''
      });
      toast.success('Expense added successfully!');
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense. Please try again.');
    }
  };

  const handleViewExpense = (expense: any) => {
    setSelectedExpense(expense);
    setIsViewExpenseDialogOpen(true);
  };

  const getUserInitials = (name: string | undefined, email: string) => {
    if (name && name.trim() !== '') {
      return name.substring(0, 2).toUpperCase();
    }
    const [emailName] = email.split('@');
    return emailName.substring(0, 2).toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Receipt className="w-5 h-5 text-accent" />
              </div>
              <div>
                <CardTitle>All Expenses</CardTitle>
                <CardDescription>
                  {filteredAndSortedExpenses.length} expenses • Total: {formatAmount(totalAmount)}
                </CardDescription>
              </div>
            </div>
            <Button className="gap-2" onClick={() => setIsAddExpenseDialogOpen(true)}>
              <PlusCircle className="w-4 h-4" />
              Add Expense
            </Button>
          </div>
          
          {/* Filter Section */}
          <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="w-40">
              <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="All employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All employees</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.email}>
                      {employee.name || employee.email.split('@')[0]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-40">
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="All months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All months</SelectItem>
                  {uniqueMonths.map(month => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-40">
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger>
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {uniqueYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
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
                <TableHead>Profile</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSort('employee')}
                    className="gap-1 hover:bg-transparent"
                  >
                    Employee
                    <ArrowUpDown className="w-3 h-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSort('amount')}
                    className="gap-1 hover:bg-transparent"
                  >
                    Amount
                    <ArrowUpDown className="w-3 h-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSort('description')}
                    className="gap-1 hover:bg-transparent"
                  >
                    Description
                    <ArrowUpDown className="w-3 h-3" />
                  </Button>
                </TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>File</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSort('date')}
                    className="gap-1 hover:bg-transparent"
                  >
                    Date
                    <ArrowUpDown className="w-3 h-3" />
                  </Button>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.keys(groupedExpenses).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No expenses found
                  </TableCell>
                </TableRow>
              ) : (
                Object.entries(groupedExpenses).map(([company, companyExpenses]) => (
                  <>
                    {/* Company Group Header */}
                    <TableRow key={company} className="bg-muted/50">
                      <TableCell colSpan={9} className="font-bold py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleCompanyExpansion(company)}
                              className="p-1 h-6 w-6 mr-2"
                            >
                              {expandedCompanies[company] ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </Button>
                            <span>{company}</span>
                            <Badge variant="secondary" className="ml-2">
                              {companyExpenses.length} expenses
                            </Badge>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">
                              Total: {formatAmount(companyExpenses.reduce((sum, exp) => sum + exp.amount, 0))}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {/* Company Expenses */}
                    {expandedCompanies[company] && companyExpenses.map((expense) => {
                      const employee = employees.find(emp => emp.email === expense.userId);
                      return (
                        <TableRow key={expense.id}>
                          <TableCell className="pl-8">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={employee?.profilePicture || ''} alt={employee?.name || expense.userId} />
                              <AvatarFallback>
                                {getUserInitials(employee?.name, expense.userId)}
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell className="font-medium">
                            {employee?.name || expense.userId.split('@')[0]}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-semibold">
                              {formatAmount(expense.amount)}
                            </Badge>
                          </TableCell>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell>{expense.company || 'N/A'}</TableCell>
                          <TableCell>{expense.sector || 'N/A'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getFileIcon(expense.fileName)}
                              <span className="text-sm text-muted-foreground">
                                {expense.fileName || 'No file'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(expense.timestamp).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewExpense(expense)}
                              className="gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteClick(expense.id)}
                              className="gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </>
                ))
              )}
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
              This action cannot be undone. This will permanently delete the expense record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Add Expense Dialog */}
      <Dialog open={isAddExpenseDialogOpen} onOpenChange={setIsAddExpenseDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
            <DialogDescription>
              Add an expense for any employee in the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="employee" className="text-sm font-medium">Employee</label>
              <Select value={newExpense.userId} onValueChange={(value) => setNewExpense({...newExpense, userId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.email}>
                      {employee.name || employee.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium">Amount (₹)</label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">Description</label>
              <Input
                id="description"
                placeholder="Enter expense description"
                value={newExpense.description}
                onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="date" className="text-sm font-medium">Date</label>
                <Input
                  id="date"
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="company" className="text-sm font-medium">Company</label>
                <Input
                  id="company"
                  placeholder="Company name"
                  value={newExpense.company}
                  onChange={(e) => setNewExpense({...newExpense, company: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="sector" className="text-sm font-medium">Sector</label>
              <Input
                id="sector"
                placeholder="Sector"
                value={newExpense.sector}
                onChange={(e) => setNewExpense({...newExpense, sector: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddExpenseDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddExpense}>
              Add Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Expense Dialog */}
      <Dialog open={isViewExpenseDialogOpen} onOpenChange={setIsViewExpenseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
            <DialogDescription>
              Full details of the expense
            </DialogDescription>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Employee</p>
                  <div className="flex items-center gap-2 mt-1">
                    {(() => {
                      const employee = employees.find(emp => emp.email === selectedExpense.userId);
                      return (
                        <>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={employee?.profilePicture || ''} alt={employee?.name || selectedExpense.userId} />
                            <AvatarFallback>
                              {getUserInitials(employee?.name, selectedExpense.userId)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {employee?.name || selectedExpense.userId}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium">{formatAmount(selectedExpense.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{new Date(selectedExpense.timestamp).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p className="font-medium">{selectedExpense.company || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sector</p>
                  <p className="font-medium">{selectedExpense.sector || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">{selectedExpense.status || 'Pending'}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="font-medium">{selectedExpense.description}</p>
              </div>
              
              {selectedExpense.file && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Receipt/Document</p>
                  {selectedExpense.fileName?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <img 
                      src={selectedExpense.file} 
                      alt="Receipt" 
                      className="max-w-full h-auto rounded-lg border"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <FileText className="w-5 h-5" />
                      <span>{selectedExpense.fileName}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewExpenseDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={deleteUserDialogOpen} onOpenChange={setDeleteUserDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90">
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default AllExpensesTableEnhanced;