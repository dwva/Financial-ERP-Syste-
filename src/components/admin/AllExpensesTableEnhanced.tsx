import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
  clientName: string;
  candidateName: string;
  sector: string;
  serviceName: string;
  overdue: boolean;
  overdueDays: string;
}

type SortField = 'employee' | 'amount' | 'date' | 'description';
type SortOrder = 'asc' | 'desc';

const AllExpensesTableEnhanced = () => {
  const { user: currentUser } = useAuth();
  const { expenses, employees, deleteExpense, addExpense, refreshData, dropdownData, serviceCharges } = useData();
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
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({});
  const [allExpanded, setAllExpanded] = useState<boolean>(false);
  const [newExpense, setNewExpense] = useState<ExpenseForm>({
    userId: '',
    amount: '',
    description: '',
    date: '',
    company: '',
    clientName: '',
    candidateName: '',
    sector: '',
    serviceName: '',
    overdue: false,
    overdueDays: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false); // Add this state to prevent duplicate submissions
  
  // Autocomplete states
  const [clientSearch, setClientSearch] = useState('');
  const [candidateSearch, setCandidateSearch] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [showCandidateSuggestions, setShowCandidateSuggestions] = useState(false);
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
  const clientInputRef = useRef<HTMLDivElement>(null);
  const candidateInputRef = useRef<HTMLDivElement>(null);
  const companyInputRef = useRef<HTMLDivElement>(null);
  const clientSuggestionsRef = useRef<HTMLDivElement>(null);
  const candidateSuggestionsRef = useRef<HTMLDivElement>(null);
  const companySuggestionsRef = useRef<HTMLDivElement>(null);

  // Filter dropdown data by type
  const companyOptions = useMemo(() => 
    dropdownData.filter(item => item.type === 'company').map(item => item.value), 
    [dropdownData]
  );
  
  const clientOptions = useMemo(() => 
    dropdownData.filter(item => item.type === 'client').map(item => item.value), 
    [dropdownData]
  );
  
  const candidateOptions = useMemo(() => 
    dropdownData.filter(item => item.type === 'candidate').map(item => item.value), 
    [dropdownData]
  );
  
  // Get unique sectors from service charges
  const sectorOptions = useMemo(() => {
    const sectors = serviceCharges
      .map(service => service.sector)
      .filter((sector, index, self) => sector && self.indexOf(sector) === index) as string[];
    return sectors.sort();
  }, [serviceCharges]);
  
  // Get service names filtered by selected sector
  const serviceOptions = useMemo(() => {
    if (!newExpense.sector) return [];
    return serviceCharges
      .filter(service => service.sector === newExpense.sector)
      .map(service => service.name)
      .sort();
  }, [serviceCharges, newExpense.sector]);

  // Filter suggestions based on search term (alphabetically sorted)
  const clientSuggestions = useMemo(() => {
    if (!clientSearch) return [];
    return clientOptions
      .filter(option => 
        option.toLowerCase().includes(clientSearch.toLowerCase())
      )
      .sort() // Sort alphabetically
      .slice(0, 10); // Limit to 10 suggestions
  }, [clientOptions, clientSearch]);

  const candidateSuggestions = useMemo(() => {
    if (!candidateSearch) return [];
    return candidateOptions
      .filter(option => 
        option.toLowerCase().includes(candidateSearch.toLowerCase())
      )
      .sort() // Sort alphabetically
      .slice(0, 10); // Limit to 10 suggestions
  }, [candidateOptions, candidateSearch]);

  const companySuggestions = useMemo(() => {
    if (!companySearch) return [];
    return companyOptions
      .filter(option => 
        option.toLowerCase().includes(companySearch.toLowerCase())
      )
      .sort() // Sort alphabetically
      .slice(0, 10); // Limit to 10 suggestions
  }, [companyOptions, companySearch]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close client suggestions
      if (
        clientInputRef.current && 
        !clientInputRef.current.contains(event.target as Node) &&
        clientSuggestionsRef.current && 
        !clientSuggestionsRef.current.contains(event.target as Node)
      ) {
        setShowClientSuggestions(false);
      }
      
      // Close candidate suggestions
      if (
        candidateInputRef.current && 
        !candidateInputRef.current.contains(event.target as Node) &&
        candidateSuggestionsRef.current && 
        !candidateSuggestionsRef.current.contains(event.target as Node)
      ) {
        setShowCandidateSuggestions(false);
      }
      
      // Close company suggestions
      if (
        companyInputRef.current && 
        !companyInputRef.current.contains(event.target as Node) &&
        companySuggestionsRef.current && 
        !companySuggestionsRef.current.contains(event.target as Node)
      ) {
        setShowCompanySuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Set default employee to current admin user when dialog opens
  useEffect(() => {
    if (isAddExpenseDialogOpen && currentUser?.email) {
      setNewExpense(prev => ({
        ...prev,
        userId: currentUser.email || ''
      }));
      // Reset search fields when dialog opens
      setClientSearch('');
      setCandidateSearch('');
      setCompanySearch('');
    }
  }, [isAddExpenseDialogOpen, currentUser]);

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
          expense.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  // Group expenses by client name
  const groupedExpenses = useMemo(() => {
    const groups: Record<string, any[]> = {};
    
    filteredAndSortedExpenses.forEach(expense => {
      // Normalize client name to handle case and whitespace differences
      const clientName = expense.clientName 
        ? expense.clientName.trim() 
        : 'Unknown Client';
      
      if (!groups[clientName]) {
        groups[clientName] = [];
      }
      groups[clientName].push(expense);
    });
    
    // Debug logging to see grouping
    console.log('Grouped expenses by client:', groups);
    
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

  const toggleClientExpansion = (clientName: string) => {
    setExpandedClients(prev => ({
      ...prev,
      [clientName]: !prev[clientName]
    }));
  };

  const toggleAllExpansion = () => {
    const newExpandedState = !allExpanded;
    const newExpandedClients: Record<string, boolean> = {};
    
    Object.keys(groupedExpenses).forEach(clientName => {
      newExpandedClients[clientName] = newExpandedState;
    });
    
    setExpandedClients(newExpandedClients);
    setAllExpanded(newExpandedState);
  };

  const handleDeleteClick = (id: string) => {
    setExpenseToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (expenseToDelete) {
      try {
        await deleteExpense(expenseToDelete);
        toast.success('Expense deleted successfully');
      } catch (error) {
        console.error('Error deleting expense:', error);
        toast.error('Failed to delete expense');
      } finally {
        setDeleteDialogOpen(false);
        setExpenseToDelete(null);
      }
    }
  };

  const handleAddExpense = async () => {
    // Prevent duplicate submissions
    if (isSubmitting) {
      return;
    }
    
    // Validate required fields
    if (!newExpense.userId || !newExpense.amount || !newExpense.description || !newExpense.date) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Validate amount is a positive number
    const amount = parseFloat(newExpense.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid positive amount');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Calculate if expense is overdue based on overdue days
      let isOverdue = newExpense.overdue;
      if (newExpense.overdueDays && !isNaN(parseInt(newExpense.overdueDays))) {
        const dueDate = new Date(newExpense.date);
        dueDate.setDate(dueDate.getDate() + parseInt(newExpense.overdueDays));
        isOverdue = dueDate < new Date();
      }
      
      const expenseData = {
        userId: newExpense.userId,
        amount: parseFloat(newExpense.amount),
        description: newExpense.description,
        date: newExpense.date,
        company: newExpense.company,
        clientName: newExpense.clientName,
        candidateName: newExpense.candidateName,
        sector: newExpense.sector,
        serviceName: newExpense.serviceName,
        overdue: isOverdue,
        overdueDays: newExpense.overdueDays // Add this line to save overdueDays
      };

      await addExpense(expenseData);
      
      toast.success('Expense added successfully!');
      setIsAddExpenseDialogOpen(false);
      
      // Reset form
      setNewExpense({
        userId: '',
        amount: '',
        description: '',
        date: '',
        company: '',
        clientName: '',
        candidateName: '',
        sector: '',
        serviceName: '',
        overdue: false,
        overdueDays: ''
      });
      setClientSearch(''); // Reset client search
      setCandidateSearch(''); // Reset candidate search
      setCompanySearch(''); // Reset company search
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense');
    } finally {
      // Reset submitting state
      setIsSubmitting(false);
    }
  };

  const handleViewExpense = (expense: any) => {
    setSelectedExpense(expense);
    setIsViewExpenseDialogOpen(true);
  };

  const handleClientSelect = (client: string) => {
    setNewExpense({...newExpense, clientName: client});
    setClientSearch(client);
    setShowClientSuggestions(false);
  };

  const handleCandidateSelect = (candidate: string) => {
    setNewExpense({...newExpense, candidateName: candidate});
    setCandidateSearch(candidate);
    setShowCandidateSuggestions(false);
  };

  const handleCompanySelect = (company: string) => {
    setNewExpense({...newExpense, company: company});
    setCompanySearch(company);
    setShowCompanySuggestions(false);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterEmployee('all');
    setFilterMonth('all');
    setFilterYear('all');
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getUserInitials = (name: string | undefined, email: string) => {
    if (name) {
      const names = name.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const getFileIcon = (fileName: string | null) => {
    if (!fileName) return <FileText className="w-4 h-4 text-muted-foreground" />;
    
    if (fileName.match(/\.(jpg|jpeg|png|gif)$/i)) {
      return <ImageIcon className="w-4 h-4 text-muted-foreground" />;
    }
    
    if (fileName.match(/\.(pdf)$/i)) {
      return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
    
    return <FileText className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>All Expenses</CardTitle>
            <CardDescription>Manage and view all expense records</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={refreshData} size="sm" variant="outline">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setIsAddExpenseDialogOpen(true)} size="sm">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </div>
        
        <div className="pt-4 border-t">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-48 text-sm h-10"
                />
              </div>
              
              <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                <SelectTrigger className="w-full sm:w-40 text-sm h-10">
                  <SelectValue placeholder="Employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.email}>
                      {employee.name || employee.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="w-full sm:w-28 text-sm h-10">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {uniqueMonths.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-full sm:w-20 text-sm h-10">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {uniqueYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={clearFilters} size="sm">
                <Filter className="w-4 h-4" />
                Clear
              </Button>
              <Button variant="outline" onClick={toggleAllExpansion} size="sm">
                {allExpanded ? 'Collapse All' : 'Expand All'}
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-[400px] overflow-y-auto"> {/* Reduced max height from 600px to 400px for better visibility */}
            <Table className="w-full min-w-full">
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow className="h-10 border-b">
                  <TableHead className="w-[40px] py-2 text-xs">Profile</TableHead>
                  <TableHead className="w-[120px] py-2 text-xs">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSort('employee')}
                      className="gap-1 hover:bg-transparent h-8 px-2 w-full justify-start"
                    >
                      Employee
                      <ArrowUpDown className="w-3 h-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[80px] py-2 text-xs">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSort('amount')}
                      className="gap-1 hover:bg-transparent h-8 px-2 w-full justify-start"
                    >
                      Amount
                      <ArrowUpDown className="w-3 h-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[150px] py-2 text-xs">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSort('description')}
                      className="gap-1 hover:bg-transparent h-8 px-2 w-full justify-start"
                    >
                      Description
                      <ArrowUpDown className="w-3 h-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[120px] py-2 text-xs">Client Name</TableHead>
                  <TableHead className="w-[120px] py-2 text-xs">Candidate Name</TableHead>
                  <TableHead className="w-[100px] py-2 text-xs">Sector</TableHead>
                  <TableHead className="w-[100px] py-2 text-xs">File</TableHead>
                  <TableHead className="w-[100px] py-2 text-xs">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSort('date')}
                      className="gap-1 hover:bg-transparent h-8 px-2 w-full justify-start"
                    >
                      Date
                      <ArrowUpDown className="w-3 h-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[80px] py-2 text-xs">Status</TableHead>
                  <TableHead className="w-[100px] py-2 text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.keys(groupedExpenses).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                      No expenses found
                    </TableCell>
                  </TableRow>
                ) : (
                  Object.entries(groupedExpenses).map(([clientName, clientExpenses]) => (
                    <React.Fragment key={clientName}>
                      {/* Client Group Header */}
                      <TableRow className="bg-muted/50 h-10 border-b">
                        <TableCell colSpan={11} className="font-bold py-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleClientExpansion(clientName)}
                                className="p-1 h-6 w-6 mr-2"
                              >
                                {expandedClients[clientName] ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </Button>
                              <span className="truncate text-sm">Client: {clientName}</span>
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {clientExpenses.length} expenses
                              </Badge>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="text-xs">
                                Total: {formatAmount(clientExpenses.reduce((sum, exp) => sum + exp.amount, 0))}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {/* Client Expenses */}
                      {expandedClients[clientName] && clientExpenses.map((expense) => {
                        const employee = employees.find(emp => emp.email === expense.userId);
                        return (
                          <TableRow key={expense.id} className="h-12 border-b">
                            <TableCell className="pl-8 py-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={employee?.profilePicture || ''} alt={employee?.name || expense.userId} />
                                <AvatarFallback>
                                  {getUserInitials(employee?.name, expense.userId)}
                                </AvatarFallback>
                              </Avatar>
                            </TableCell>
                            <TableCell className="font-medium py-2 text-sm">
                              {employee?.name || expense.userId.split('@')[0]}
                            </TableCell>
                            <TableCell className="py-2">
                              <Badge variant="secondary" className="font-semibold text-xs">
                                {formatAmount(expense.amount)}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2 max-w-xs truncate text-sm">{expense.description}</TableCell>
                            <TableCell className="py-2 text-sm">{expense.clientName || 'N/A'}</TableCell>
                            <TableCell className="py-2 text-sm">{expense.candidateName || 'N/A'}</TableCell>
                            <TableCell className="py-2 text-sm">{expense.sector || 'N/A'}</TableCell>
                            <TableCell className="py-2">
                              <div className="flex items-center gap-1">
                                {getFileIcon(expense.fileName)}
                                <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                                  {expense.fileName || 'No file'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground py-2 text-xs">
                              {new Date(expense.timestamp).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="py-2">
                              {expense.overdue ? (
                                <Badge variant="destructive" className="text-xs">Overdue</Badge>
                              ) : (
                                <Badge variant="default" className="text-xs">Normal</Badge>
                              )}
                            </TableCell>
                            <TableCell className="py-2">
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewExpense(expense)}
                                  className="h-8 px-2"
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteClick(expense.id)}
                                  className="h-8 px-2"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </React.Fragment>
                  ))
                )}
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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
            <DialogDescription>
              Add an expense for any employee in the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <label htmlFor="employee" className="text-sm font-medium">Employee</label>
              <Select value={newExpense.userId || currentUser?.email || ''} onValueChange={(value) => setNewExpense({...newExpense, userId: value})}>
                <SelectTrigger className="h-10">
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
                className="h-10"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">Description</label>
              <Input
                id="description"
                placeholder="Enter expense description"
                value={newExpense.description}
                onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                className="h-10"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label htmlFor="date" className="text-sm font-medium">Date</label>
                <Input
                  id="date"
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                  className="h-10"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="company" className="text-sm font-medium">Company</label>
                <div className="relative" ref={companyInputRef}>
                  <Input
                    id="company"
                    placeholder="Enter company"
                    value={companySearch}
                    onChange={(e) => {
                      setCompanySearch(e.target.value);
                      setNewExpense({...newExpense, company: e.target.value});
                      setShowCompanySuggestions(true);
                    }}
                    onFocus={() => setShowCompanySuggestions(true)}
                    className="h-10"
                  />
                  {showCompanySuggestions && companySuggestions.length > 0 && (
                    <div 
                      ref={companySuggestionsRef}
                      className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto"
                    >
                      {companySuggestions.map((company, index) => (
                        <div
                          key={index}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                          onClick={() => handleCompanySelect(company)}
                        >
                          {company}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label htmlFor="clientName" className="text-sm font-medium">Client Name</label>
                <div className="relative" ref={clientInputRef}>
                  <Input
                    id="clientName"
                    placeholder="Enter client name"
                    value={clientSearch}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      setNewExpense({...newExpense, clientName: e.target.value});
                      setShowClientSuggestions(true);
                    }}
                    onFocus={() => setShowClientSuggestions(true)}
                    className="h-10"
                  />
                  {showClientSuggestions && clientSuggestions.length > 0 && (
                    <div 
                      ref={clientSuggestionsRef}
                      className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto"
                    >
                      {clientSuggestions.map((client, index) => (
                        <div
                          key={index}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                          onClick={() => handleClientSelect(client)}
                        >
                          {client}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="candidateName" className="text-sm font-medium">Candidate Name</label>
                <div className="relative" ref={candidateInputRef}>
                  <Input
                    id="candidateName"
                    placeholder="Enter candidate name"
                    value={candidateSearch}
                    onChange={(e) => {
                      setCandidateSearch(e.target.value);
                      setNewExpense({...newExpense, candidateName: e.target.value});
                      setShowCandidateSuggestions(true);
                    }}
                    onFocus={() => setShowCandidateSuggestions(true)}
                    className="h-10"
                  />
                  {showCandidateSuggestions && candidateSuggestions.length > 0 && (
                    <div 
                      ref={candidateSuggestionsRef}
                      className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto"
                    >
                      {candidateSuggestions.map((candidate, index) => (
                        <div
                          key={index}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                          onClick={() => handleCandidateSelect(candidate)}
                        >
                          {candidate}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label htmlFor="sector" className="text-sm font-medium">Sector</label>
                <Select value={newExpense.sector} onValueChange={(value) => setNewExpense({...newExpense, sector: value})}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectorOptions.map((sector) => (
                      <SelectItem key={sector} value={sector}>
                        {sector}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="serviceName" className="text-sm font-medium">Service Name</label>
                <Select 
                  value={newExpense.serviceName} 
                  onValueChange={(value) => setNewExpense({...newExpense, serviceName: value})}
                  disabled={!newExpense.sector}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceOptions.map((service) => (
                      <SelectItem key={service} value={service}>
                        {service}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="overdue"
                checked={newExpense.overdue}
                onChange={(e) => setNewExpense({...newExpense, overdue: e.target.checked})}
                className="h-4 w-4"
              />
              <label htmlFor="overdue" className="text-sm font-medium">Mark as Overdue</label>
            </div>
            
            {newExpense.overdue && (
              <div className="space-y-2">
                <label htmlFor="overdueDays" className="text-sm font-medium">Overdue Days</label>
                <Input
                  id="overdueDays"
                  type="number"
                  placeholder="Enter number of days overdue"
                  value={newExpense.overdueDays}
                  onChange={(e) => setNewExpense({...newExpense, overdueDays: e.target.value})}
                  className="h-10"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddExpenseDialogOpen(false)} disabled={isSubmitting} type="button">
              Cancel
            </Button>
            <Button onClick={handleAddExpense} disabled={isSubmitting} type="button">
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding...
                </>
              ) : (
                'Add Expense'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Expense Dialog */}
      <Dialog open={isViewExpenseDialogOpen} onOpenChange={setIsViewExpenseDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
            <DialogDescription>
              Detailed information about this expense record.
            </DialogDescription>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Employee</label>
                  <p className="font-medium">{selectedExpense.userId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Amount</label>
                  <p className="font-medium">{formatAmount(selectedExpense.amount)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date</label>
                  <p className="font-medium">{new Date(selectedExpense.timestamp).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className="font-medium">
                    {selectedExpense.overdue ? (
                      <Badge variant="destructive">Overdue</Badge>
                    ) : (
                      <Badge variant="default">Normal</Badge>
                    )}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="font-medium">{selectedExpense.description}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Company</label>
                  <p className="font-medium">{selectedExpense.company || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Client Name</label>
                  <p className="font-medium">{selectedExpense.clientName || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Candidate Name</label>
                  <p className="font-medium">{selectedExpense.candidateName || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Sector</label>
                  <p className="font-medium">{selectedExpense.sector || 'N/A'}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Service Name</label>
                <p className="font-medium">{selectedExpense.serviceName || 'N/A'}</p>
              </div>
              
              {selectedExpense.overdue && selectedExpense.overdueDays && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Overdue Days</label>
                  <p className="font-medium">{selectedExpense.overdueDays} days</p>
                </div>
              )}
              
              {selectedExpense.fileName && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Attached File</label>
                  <div className="flex items-center gap-2 mt-1">
                    {getFileIcon(selectedExpense.fileName)}
                    <span className="text-sm">{selectedExpense.fileName}</span>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewExpenseDialogOpen(false)}>Close</Button>
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