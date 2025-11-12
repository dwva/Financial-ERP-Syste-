import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Receipt, 
  FileText, 
  Image as ImageIcon, 
  AlertTriangle, 
  Download, 
  Trash2,
  Eye,
  X,
  CheckCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const OverdueExpenses = () => {
  const { expenses, employees, deleteExpense, invoiceHistory, updateExpense } = useData();
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [fileViewerOpen, setFileViewerOpen] = useState<boolean>(false);
  const [currentFile, setCurrentFile] = useState<{ url: string; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'expenses' | 'invoices' | 'partial'>('expenses');

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

  // Filter for overdue expenses
  const overdueExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter(expense => {
      // Include expenses that are marked as overdue
      if (expense.overdue) {
        // Check if the expense is actually overdue based on date and overdueDays
        if (expense.overdueDays) {
          const expenseDate = new Date(expense.date);
          const dueDate = new Date(expenseDate);
          dueDate.setDate(expenseDate.getDate() + parseInt(expense.overdueDays));
          return dueDate < now;
        }
        return true;
      }
      
      // Also include partial payments that are not fully received and are overdue
      if (expense.partialPayment && !expense.partialReceived) {
        // Check if the expense is overdue (30 days since the expense date)
        const expenseDate = new Date(expense.date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return expenseDate < thirtyDaysAgo;
      }
      
      return false;
    });
  }, [expenses]);
  
  // Filter for partial payment expenses (not necessarily overdue)
  const partialPaymentExpenses = useMemo(() => {
    return expenses.filter(expense => 
      expense.partialPayment && 
      !expense.partialReceived && 
      expense.status === 'partial'
    );
  }, [expenses]);

  // Filter for overdue invoices
  const overdueInvoices = useMemo(() => {
    const now = new Date();
    return invoiceHistory.filter(invoice => {
      // Check if invoice has a due date and it's in the past
      if (invoice.dueDate) {
        const dueDate = new Date(invoice.dueDate);
        if (dueDate < now) {
          // Find associated expenses for this invoice
          const associatedExpenses = expenses.filter(expense => 
            expense.company === invoice.companyName && 
            expense.hasInvoice
          );
          
          // Check if any associated expense is not received
          const hasUnpaidExpenses = associatedExpenses.some(expense => 
            (expense.status || 'pending') !== 'received'
          );
          
          return hasUnpaidExpenses;
        }
      }
      return false;
    });
  }, [invoiceHistory, expenses]);

  const handleDelete = (id: string) => {
    setDeletingId(id);
  };

  const handleConfirmDelete = () => {
    if (deletingId) {
      deleteExpense(deletingId);
      setSelectedExpenses(selectedExpenses.filter(id => id !== deletingId));
      setDeletingId(null);
    }
  };

  const handleCancelDelete = () => {
    setDeletingId(null);
  };

  const handleFileView = (url: string, name: string) => {
    setCurrentFile({ url, name });
    setFileViewerOpen(true);
  };

  const handleFileClose = () => {
    setCurrentFile(null);
    setFileViewerOpen(false);
  };

  const handleMarkAsPaid = (id: string) => {
    updateExpense(id, { status: 'paid' });
    setSelectedExpenses(selectedExpenses.filter(expenseId => expenseId !== id));
  };

  // New function to mark invoice as received
  const handleMarkInvoiceAsReceived = async (invoiceId: string) => {
    try {
      // Find the invoice
      const invoice = invoiceHistory.find(inv => inv.id === invoiceId);
      if (!invoice) {
        toast.error('Invoice not found');
        return;
      }

      // Find associated expenses for this invoice
      const associatedExpenses = expenses.filter(expense => 
        expense.company === invoice.companyName && 
        expense.hasInvoice
      );
      
      // Update each associated expense to 'received' status
      for (const expense of associatedExpenses) {
        await updateExpense(expense.id, { 
          status: 'received',
          partialReceived: true // Mark as fully received if it was partial
        });
      }
      
      toast.success('Invoice marked as received and associated expenses updated!');
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast.error('Failed to update invoice status. Please try again.');
    }
  };

  // New function to mark partial payment as fully received
  const handleMarkPartialAsReceived = async (expenseId: string) => {
    try {
      // Find the expense
      const expense = expenses.find(exp => exp.id === expenseId);
      if (!expense) {
        toast.error('Expense not found');
        return;
      }
      
      // Find the associated invoice
      const invoice = findInvoiceForExpense(expense);
      
      // If invoice exists, mark as fully received with invoice total
      if (invoice) {
        await updateExpense(expenseId, { 
          status: 'received',
          partialReceived: true,
          partialAmount: invoice.total // Set partial amount to invoice total when fully received
        });
      } else {
        // If no invoice, fall back to expense amount
        await updateExpense(expenseId, { 
          status: 'received',
          partialReceived: true,
          partialAmount: expense.amount // Set partial amount to expense amount when fully received
        });
      }
      
      toast.success('Partial payment marked as fully received!');
    } catch (error) {
      console.error('Error updating partial payment status:', error);
      toast.error('Failed to update partial payment status. Please try again.');
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const calculateDaysOverdue = (dateString: string, overdueDays: string | undefined) => {
    const expenseDate = new Date(dateString);
    let dueDate = new Date(expenseDate);
    
    if (overdueDays) {
      dueDate.setDate(expenseDate.getDate() + parseInt(overdueDays));
    }
    
    const today = new Date();
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  const calculateDaysInvoiceOverdue = (dueDate: string) => {
    const invoiceDueDate = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - invoiceDueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedExpenses(overdueExpenses.map(expense => expense.id));
    } else {
      setSelectedExpenses([]);
    }
  };

  const handleSelectExpense = (expenseId: string) => {
    if (selectedExpenses.includes(expenseId)) {
      setSelectedExpenses(prev => prev.filter(id => id !== expenseId));
    } else {
      setSelectedExpenses(prev => [...prev, expenseId]);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteExpense(id);
      toast.success('Expense deleted successfully');
      setSelectedExpenses(prev => prev.filter(expenseId => expenseId !== id));
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDelete = async () => {
    try {
      for (const id of selectedExpenses) {
        await deleteExpense(id);
      }
      toast.success(`${selectedExpenses.length} expenses deleted successfully`);
      setSelectedExpenses([]);
    } catch (error) {
      console.error('Error deleting expenses:', error);
      toast.error('Failed to delete expenses');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <CardTitle>Overdue Expenses & Invoices</CardTitle>
              <CardDescription>Manage overdue expense records and invoice bills</CardDescription>
            </div>
          </div>
          {(activeTab === 'expenses' || activeTab === 'partial') && selectedExpenses.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleBulkDelete}
              disabled={deletingId !== null}
            >
              {deletingId ? 'Deleting...' : `Delete ${selectedExpenses.length} Selected`}
            </Button>
          )}
        </div>
        
        {/* Tab Navigation */}
        <div className="flex border-b mt-4">
          <button
            className={`py-2 px-4 font-medium text-sm ${activeTab === 'expenses' ? 'border-b-2 border-destructive text-destructive' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('expenses')}
          >
            Overdue Expenses ({overdueExpenses.length})
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm ${activeTab === 'invoices' ? 'border-b-2 border-destructive text-destructive' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('invoices')}
          >
            Overdue Invoices ({overdueInvoices.length})
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm ${activeTab === 'partial' ? 'border-b-2 border-destructive text-destructive' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('partial')}
          >
            Partial Payments ({partialPaymentExpenses.length})
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {activeTab === 'expenses' ? (
          // Overdue Expenses Table
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedExpenses.length === overdueExpenses.length && overdueExpenses.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Days Overdue</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      No overdue expenses found
                    </TableCell>
                  </TableRow>
                ) : (
                  overdueExpenses.map((expense) => {
                    const employee = employees.find(emp => emp.email === expense.userId);
                    const daysOverdue = calculateDaysOverdue(expense.date, expense.overdueDays);
                    const isSelected = selectedExpenses.includes(expense.id);
                    
                    return (
                      <TableRow key={expense.id} className={isSelected ? 'bg-muted' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleSelectExpense(expense.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {employee?.name || expense.userId.split('@')[0]}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-semibold">
                            {formatAmount(expense.amount)}
                          </Badge>
                          {expense.partialPayment && (
                            <div className="mt-1">
                              <Badge variant="outline" className="text-xs">
                                Partial: {formatAmount(expense.partialAmount || 0)}
                              </Badge>
                              {expense.partialReceived ? (
                                <Badge variant="default" className="ml-1 text-xs bg-green-500">
                                  Received
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="ml-1 text-xs">
                                  Pending
                                </Badge>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell>{expense.clientName || 'N/A'}</TableCell>
                        <TableCell>{expense.company || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getFileIcon(expense.fileName)}
                            {expense.fileName ? (
                              <div className="flex items-center gap-1">
                                <span className="text-sm text-muted-foreground">
                                  {expense.fileName}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleFileView(expense.file, expense.fileName!)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                No file
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(expense.date)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {daysOverdue} days
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the expense 
                                  for {employee?.name || expense.userId} with amount {formatAmount(expense.amount)}.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteExpense(expense.id)}
                                  disabled={deletingId === expense.id}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  {deletingId === expense.id ? 'Deleting...' : 'Delete'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        ) : activeTab === 'invoices' ? (
          // Overdue Invoices Table
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Candidate Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Invoice Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Days Overdue</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No overdue invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  overdueInvoices.map((invoice) => {
                    const daysOverdue = calculateDaysInvoiceOverdue(invoice.dueDate);
                    
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell>{invoice.companyName}</TableCell>
                        <TableCell>{invoice.candidateName || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-semibold">
                            {formatAmount(invoice.total)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(invoice.date)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(invoice.dueDate)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {daysOverdue} days
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                // For now, we'll just show a toast
                                toast.info('Invoice details would be shown here');
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => handleMarkInvoiceAsReceived(invoice.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Mark Received
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          // Partial Payments Table
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedExpenses.length === partialPaymentExpenses.length && partialPaymentExpenses.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Partial Amount</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partialPaymentExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      No partial payment expenses found
                    </TableCell>
                  </TableRow>
                ) : (
                  partialPaymentExpenses.map((expense) => {
                    const employee = employees.find(emp => emp.email === expense.userId);
                    const isSelected = selectedExpenses.includes(expense.id);
                    const partialAmount = expense.partialAmount || 0;
                    
                    // Use invoice total for balance calculation if available
                    const invoice = findInvoiceForExpense(expense);
                    const totalAmount = invoice ? invoice.total : expense.amount;
                    const balance = totalAmount - partialAmount;
                    
                    return (
                      <TableRow key={expense.id} className={isSelected ? 'bg-muted' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleSelectExpense(expense.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {employee?.name || expense.userId.split('@')[0]}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-semibold">
                            {formatAmount(totalAmount)}
                          </Badge>
                        </TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell>{expense.clientName || 'N/A'}</TableCell>
                        <TableCell>{expense.company || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-semibold">
                            {formatAmount(partialAmount)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="font-semibold">
                            {formatAmount(balance)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(expense.date)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => handleMarkPartialAsReceived(expense.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Mark Received
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the expense 
                                    for {employee?.name || expense.userId} with amount {formatAmount(expense.amount)}.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteExpense(expense.id)}
                                    disabled={deletingId === expense.id}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    {deletingId === expense.id ? 'Deleting...' : 'Delete'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* File Viewer Modal */}
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
             style={{ display: fileViewerOpen ? 'flex' : 'none' }}>
          {currentFile && (
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold truncate">{currentFile.name}</h3>
                <Button variant="ghost" size="sm" onClick={handleFileClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                {currentFile.name.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i) ? (
                  <div className="flex justify-center">
                    <img 
                      src={currentFile.url} 
                      alt={currentFile.name} 
                      className="max-w-full max-h-[70vh] object-contain"
                    />
                  </div>
                ) : currentFile.name.match(/\.pdf$/i) ? (
                  <div className="flex justify-center">
                    <iframe 
                      src={currentFile.url} 
                      className="w-full h-[70vh]"
                      title={currentFile.name}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[70vh] text-center">
                    <FileText className="w-16 h-16 text-gray-400 mb-4" />
                    <p className="mb-4">This file type cannot be previewed directly.</p>
                    <Button onClick={() => window.open(currentFile.url, '_blank')}>
                      <Download className="w-4 h-4 mr-2" />
                      Download File
                    </Button>
                  </div>
                )}
              </div>
              <div className="p-4 border-t flex justify-end">
                <Button onClick={() => window.open(currentFile.url, '_blank')}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OverdueExpenses;