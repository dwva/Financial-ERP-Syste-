import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { useNotification } from '@/contexts/NotificationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, FileText, Image as ImageIcon, ChevronDown, ChevronRight, AlertTriangle, Search } from 'lucide-react';
import { toast } from 'react-toastify';

const ExpenseStatus = () => {
  const { expenses, employees, updateExpense, invoiceHistory } = useData();
  const { addNotification } = useNotification();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({});
  const [allExpanded, setAllExpanded] = useState<boolean>(false);
  const [partialAmounts, setPartialAmounts] = useState<Record<string, number>>({});
  
  // Find invoice for an expense based on matching criteria
  const findInvoiceForExpense = (expense: any) => {
    // Look for invoices that match the expense criteria
    return invoiceHistory.find(invoice => {
      // Match by company name
      if (expense.company && invoice.companyName) {
        return expense.company.toLowerCase() === invoice.companyName.toLowerCase();
      }
      
      // Match by candidate name
      if (expense.candidateName && invoice.candidateName) {
        return expense.candidateName.toLowerCase() === invoice.candidateName.toLowerCase();
      }
      
      return false;
    });
  };
  
  // Check for overdue expenses and create notifications
  useEffect(() => {
    const checkOverdueExpenses = () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const overdueExpenses = expenses.filter(expense => {
        // Check if expense is not received and older than 30 days
        const expenseDate = new Date(expense.date);
        const isOverdue = expenseDate < thirtyDaysAgo;
        const isNotReceived = (expense.status || 'pending') !== 'received';
        
        return isOverdue && isNotReceived;
      });
      
      // Create notifications for overdue expenses
      overdueExpenses.forEach(expense => {
        const employee = employees.find(emp => emp.email === expense.userId);
        const expenseDate = new Date(expense.date);
        const daysOverdue = Math.floor((new Date().getTime() - expenseDate.getTime()) / (1000 * 60 * 60 * 24));
        
        addNotification({
          title: 'Overdue Expense Alert',
          message: `Expense from ${employee?.name || expense.userId} is overdue by ${daysOverdue} days and payment status is not received`,
          type: 'expense_updated',
          expenseId: expense.id
        });
      });
    };
    
    // Run the check when component mounts
    checkOverdueExpenses();
  }, [expenses, employees, addNotification]);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'received':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Received</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'partial':
        return <Badge className="bg-blue-500 hover:bg-blue-600"><Clock className="w-3 h-3 mr-1" />Partial</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleStatusChange = async (expenseId: string, newStatus: string) => {
    try {
      // If status is changing to "partial", we need to get the partial amount
      const expense = expenses.find(e => e.id === expenseId);
      if (newStatus === 'partial' && expense) {
        // For partial payments, we'll update both status and partial fields
        // Check if the expense is overdue (30 days since the expense date)
        const expenseDate = new Date(expense.date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const isOverdue = expenseDate < thirtyDaysAgo;
        
        await updateExpense(expenseId, { 
          status: 'partial',
          partialPayment: true,
          partialReceived: false,
          overdue: isOverdue || expense.overdue // Keep existing overdue status or set based on date
        });
      } else {
        await updateExpense(expenseId, { status: newStatus });
        // Clear partial amount from local state when status changes
        setPartialAmounts(prev => {
          const newPartialAmounts = { ...prev };
          delete newPartialAmounts[expenseId];
          return newPartialAmounts;
        });
      }
      toast.success('Expense status updated successfully!');
    } catch (error) {
      console.error('Error updating expense status:', error);
      toast.error('Failed to update expense status. Please try again.');
    }
  };

  const handlePartialAmountChange = async (expenseId: string, partialAmount: number) => {
    try {
      // Update the partial amount and mark as partial received if amount matches or exceeds invoice total
      const expense = expenses.find(e => e.id === expenseId);
      if (expense) {
        // Find the associated invoice
        const invoice = findInvoiceForExpense(expense);
        
        if (invoice) {
          // Use invoice total instead of expense amount
          const validPartialAmount = Math.min(partialAmount, invoice.total);
          const isFullyReceived = validPartialAmount >= invoice.total;
          
          // Check if the expense is overdue (30 days since the expense date)
          const expenseDate = new Date(expense.date);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const isOverdue = expenseDate < thirtyDaysAgo;
          
          await updateExpense(expenseId, { 
            partialAmount: validPartialAmount,
            partialReceived: isFullyReceived,
            status: isFullyReceived ? 'received' : 'partial',
            overdue: isOverdue || expense.overdue // Keep existing overdue status or set based on date
          });
        } else {
          // If no invoice found, fall back to expense amount
          const validPartialAmount = Math.min(partialAmount, expense.amount);
          const isFullyReceived = validPartialAmount >= expense.amount;
          
          // Check if the expense is overdue (30 days since the expense date)
          const expenseDate = new Date(expense.date);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const isOverdue = expenseDate < thirtyDaysAgo;
          
          await updateExpense(expenseId, { 
            partialAmount: validPartialAmount,
            partialReceived: isFullyReceived,
            status: isFullyReceived ? 'received' : 'partial',
            overdue: isOverdue || expense.overdue // Keep existing overdue status or set based on date
          });
        }
        
        // Update local state
        setPartialAmounts(prev => {
          const newPartialAmounts = { ...prev };
          delete newPartialAmounts[expenseId];
          return newPartialAmounts;
        });
        
        toast.success('Partial amount updated successfully!');
      }
    } catch (error) {
      console.error('Error updating partial amount:', error);
      toast.error('Failed to update partial amount. Please try again.');
    }
  };

  const filteredExpenses = useMemo(() => {
    let filtered = statusFilter === 'all' 
      ? expenses 
      : expenses.filter(expense => (expense.status || 'pending') === statusFilter);
      
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(expense => {
        // Search in employee name
        const employee = employees.find(emp => emp.email === expense.userId);
        const employeeName = employee?.name?.toLowerCase() || '';
        
        // Search in client name, company, description
        const clientName = expense.clientName?.toLowerCase() || '';
        const company = expense.company?.toLowerCase() || '';
        const description = expense.description?.toLowerCase() || '';
        
        return (
          employeeName.includes(term) ||
          clientName.includes(term) ||
          company.includes(term) ||
          description.includes(term)
        );
      });
    }
    
    return filtered;
  }, [expenses, employees, statusFilter, searchTerm]);

  // Group expenses by client name
  const groupedExpenses = useMemo(() => {
    const groups: Record<string, any[]> = {};
    
    filteredExpenses.forEach(expense => {
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
    console.log('ExpenseStatus grouped expenses by client:', groups);
    
    return groups;
  }, [filteredExpenses]);

  const toggleClientExpansion = (clientName: string) => {
    setExpandedClients(prev => ({
      ...prev,
      [clientName]: !prev[clientName]
    }));
  };

  const toggleAllExpansion = () => {
    const newExpandedState: Record<string, boolean> = {};
    Object.keys(groupedExpenses).forEach(clientName => {
      newExpandedState[clientName] = !allExpanded;
    });
    setExpandedClients(newExpandedState);
    setAllExpanded(!allExpanded);
  };

  // Calculate overdue expenses for display
  const getOverdueExpenses = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const isOverdue = expenseDate < thirtyDaysAgo;
      const isNotReceived = (expense.status || 'pending') !== 'received';
      
      return isOverdue && isNotReceived;
    });
  };

  const pendingCount = expenses.filter(expense => (expense.status || 'pending') === 'pending').length;
  const receivedCount = expenses.filter(expense => expense.status === 'received').length;
  const partialCount = expenses.filter(expense => expense.status === 'partial').length;
  const overdueCount = getOverdueExpenses().length;

  // Separate expenses into received and pending
  const receivedExpenses = useMemo(() => {
    return expenses.filter(expense => expense.status === 'received' || expense.partialReceived);
  }, [expenses]);

  const pendingExpenses = useMemo(() => {
    return expenses.filter(expense => 
      expense.status === 'pending' || 
      (expense.status === 'partial' && !expense.partialReceived)
    );
  }, [expenses]);

  // Group received expenses by client
  const groupedReceivedExpenses = useMemo(() => {
    const groups: Record<string, any[]> = {};
    
    receivedExpenses.forEach(expense => {
      // Normalize client name to handle case and whitespace differences
      const clientName = expense.clientName 
        ? expense.clientName.trim() 
        : 'Unknown Client';
    
      if (!groups[clientName]) {
        groups[clientName] = [];
      }
      groups[clientName].push(expense);
    });
    
    return groups;
  }, [receivedExpenses]);

  // Group pending expenses by client
  const groupedPendingExpenses = useMemo(() => {
    const groups: Record<string, any[]> = {};
    
    pendingExpenses.forEach(expense => {
      // Normalize client name to handle case and whitespace differences
      const clientName = expense.clientName 
        ? expense.clientName.trim() 
        : 'Unknown Client';
    
      if (!groups[clientName]) {
        groups[clientName] = [];
      }
      groups[clientName].push(expense);
    });
    
    return groups;
  }, [pendingExpenses]);

  // Toggle expansion for received expenses
  const toggleReceivedClientExpansion = (clientName: string) => {
    setExpandedClients(prev => ({
      ...prev,
      [`received_${clientName}`]: !prev[`received_${clientName}`]
    }));
  };

  // Toggle expansion for pending expenses
  const togglePendingClientExpansion = (clientName: string) => {
    setExpandedClients(prev => ({
      ...prev,
      [`pending_${clientName}`]: !prev[`pending_${clientName}`]
    }));
  };

  // Toggle all expansion for received expenses
  const toggleAllReceivedExpansion = () => {
    const newExpandedState: Record<string, boolean> = {};
    Object.keys(groupedReceivedExpenses).forEach(clientName => {
      newExpandedState[`received_${clientName}`] = !allExpanded;
    });
    setExpandedClients(newExpandedState);
    setAllExpanded(!allExpanded);
  };

  // Toggle all expansion for pending expenses
  const toggleAllPendingExpansion = () => {
    const newExpandedState: Record<string, boolean> = {};
    Object.keys(groupedPendingExpenses).forEach(clientName => {
      newExpandedState[`pending_${clientName}`] = !allExpanded;
    });
    setExpandedClients(newExpandedState);
    setAllExpanded(!allExpanded);
  };

  // Render expense table rows
  const renderExpenseRows = (expense: any, isReceivedSection: boolean = false) => {
    // Check if this specific expense is overdue
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const expenseDate = new Date(expense.date);
    const isOverdue = expenseDate < thirtyDaysAgo;
    const isNotReceived = (expense.status || 'pending') !== 'received';
    const isOverdueExpense = isOverdue && isNotReceived;
    
    // Check if expense has an associated invoice
    const hasInvoice = expense.hasInvoice;
    
    const employee = employees.find(emp => emp.email === expense.userId);
    return (
      <TableRow key={expense.id} className={isOverdueExpense ? 'bg-orange-50' : ''}>
        <TableCell className="pl-8 font-medium">
          {employee?.name || expense.userId.split('@')[0]}
        </TableCell>
        <TableCell>
          <Badge variant="secondary" className="font-semibold">
            {formatAmount(expense.amount)}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center">
            {expense.description}
            {isOverdueExpense && (
              <AlertTriangle className="w-4 h-4 ml-2 text-orange-500" />
            )}
            {hasInvoice && (
              <Badge variant="outline" className="ml-2 text-xs">
                Invoiced
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell>{expense.clientName || 'N/A'}</TableCell>
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
          {formatDate(expense.date)}
          {isOverdueExpense && (
            <div className="text-xs text-orange-500">
              {Math.floor((new Date().getTime() - expenseDate.getTime()) / (1000 * 60 * 60 * 24))} days overdue
            </div>
          )}
        </TableCell>
        <TableCell>
          {getStatusBadge(expense.status || 'pending')}
        </TableCell>
        <TableCell>
          {/* Only show status dropdown if expense has an invoice */}
          {hasInvoice ? (
            <div className="flex flex-col gap-2">
              <Select 
                value={expense.status || 'pending'} 
                onValueChange={(value) => handleStatusChange(expense.id, value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Show partial amount input when status is partial */}
              {expense.status === 'partial' && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Partial amount"
                    value={partialAmounts[expense.id] ?? expense.partialAmount ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPartialAmounts(prev => ({
                        ...prev,
                        [expense.id]: value ? parseFloat(value) : 0
                      }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const amount = partialAmounts[expense.id] ?? expense.partialAmount ?? 0;
                        handlePartialAmountChange(expense.id, amount);
                      }
                    }}
                    onBlur={() => {
                      const amount = partialAmounts[expense.id] ?? expense.partialAmount ?? 0;
                      handlePartialAmountChange(expense.id, amount);
                    }}
                    className="w-32"
                    min="0"
                    // Use invoice total as max if available, otherwise use expense amount
                    max={findInvoiceForExpense(expense)?.total || expense.amount}
                  />
                  <span className="text-sm text-muted-foreground">
                    of {formatAmount(findInvoiceForExpense(expense)?.total || expense.amount)}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">
              Not invoiced
            </div>
          )}
        </TableCell>
      </TableRow>
    );
  };

  // Render client group section
  const renderClientGroup = (clientName: string, clientExpenses: any[], isReceivedSection: boolean) => {
    // Check if any expenses in this group are overdue
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const hasOverdueExpenses = clientExpenses.some(expense => {
      const expenseDate = new Date(expense.date);
      const isOverdue = expenseDate < thirtyDaysAgo;
      const isNotReceived = (expense.status || 'pending') !== 'received';
      return isOverdue && isNotReceived;
    });
    
    const expansionKey = isReceivedSection ? `received_${clientName}` : `pending_${clientName}`;
    
    return (
      <React.Fragment key={expansionKey}>
        {/* Client Group Header */}
        <TableRow className={`bg-muted/50 ${hasOverdueExpenses ? 'bg-orange-50' : ''}`}>
          <TableCell colSpan={10} className="font-bold py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => isReceivedSection ? toggleReceivedClientExpansion(clientName) : togglePendingClientExpansion(clientName)}
                  className="p-1 h-6 w-6 mr-2"
                >
                  {expandedClients[expansionKey] ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
                <span>Client: {clientName}</span>
                {hasOverdueExpenses && (
                  <Badge variant="destructive" className="ml-2 flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Overdue Expenses
                  </Badge>
                )}
                <Badge variant="secondary" className="ml-2">
                  {clientExpenses.length} expenses
                </Badge>
              </div>
              <div className="text-right">
                <Badge variant="outline">
                  Total: {formatAmount(clientExpenses.reduce((sum, exp) => sum + exp.amount, 0))}
                </Badge>
              </div>
            </div>
          </TableCell>
        </TableRow>
        
        {/* Client Expenses */}
        {expandedClients[expansionKey] && clientExpenses.map((expense) => renderExpenseRows(expense, isReceivedSection))}
      </React.Fragment>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-accent" />
              </div>
              <div>
                <CardTitle>Expense Status</CardTitle>
                <CardDescription>
                  Manage expense approval status
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{receivedCount}</p>
                <p className="text-sm text-muted-foreground">Received</p>
              </div>
              {partialCount > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-500">{partialCount}</p>
                  <p className="text-sm text-muted-foreground">Partial</p>
                </div>
              )}
              {overdueCount > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-500">{overdueCount}</p>
                  <p className="text-sm text-muted-foreground flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 mr-1 text-orange-500" />
                    Overdue
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Received Expenses Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Received Expenses</h3>
            <Button variant="outline" onClick={toggleAllReceivedExpansion}>
              {allExpanded ? 'Collapse All' : 'Expand All'}
            </Button>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.keys(groupedReceivedExpenses).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      No received expenses found
                    </TableCell>
                  </TableRow>
                ) : (
                  Object.entries(groupedReceivedExpenses).map(([clientName, clientExpenses]) => 
                    renderClientGroup(clientName, clientExpenses, true)
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        
        {/* Pending Expenses Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Pending Expenses</h3>
            <Button variant="outline" onClick={toggleAllPendingExpansion}>
              {allExpanded ? 'Collapse All' : 'Expand All'}
            </Button>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.keys(groupedPendingExpenses).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      No pending expenses found
                    </TableCell>
                  </TableRow>
                ) : (
                  Object.entries(groupedPendingExpenses).map(([clientName, clientExpenses]) => 
                    renderClientGroup(clientName, clientExpenses, false)
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpenseStatus;