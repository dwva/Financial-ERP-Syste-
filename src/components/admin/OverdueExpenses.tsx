import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AlertTriangle, FileText, Image as ImageIcon, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

const OverdueExpenses = () => {
  const { expenses, employees, deleteExpense } = useData();
  const [overdueExpenses, setOverdueExpenses] = useState<any[]>([]);
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter expenses marked as overdue by user
  useEffect(() => {
    const overdue = expenses.filter(expense => expense.overdue === true);
    setOverdueExpenses(overdue);
  }, [expenses]);

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

  const calculateDaysOverdue = (dateString: string, overdueDays: string) => {
    // If overdueDays is provided, calculate based on that
    if (overdueDays && !isNaN(parseInt(overdueDays))) {
      const dueDate = new Date(dateString);
      dueDate.setDate(dueDate.getDate() + parseInt(overdueDays));
      const today = new Date();
      const diffTime = Math.max(today.getTime() - dueDate.getTime(), 0); // Ensure non-negative
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    
    // Fallback to original calculation
    const expenseDate = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - expenseDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleSelectExpense = (expenseId: string) => {
    setSelectedExpenses(prev => {
      if (prev.includes(expenseId)) {
        return prev.filter(id => id !== expenseId);
      } else {
        return [...prev, expenseId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedExpenses.length === overdueExpenses.length) {
      setSelectedExpenses([]);
    } else {
      setSelectedExpenses(overdueExpenses.map(expense => expense.id));
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      setDeletingId(expenseId);
      await deleteExpense(expenseId);
      // Remove from selected expenses if it was selected
      setSelectedExpenses(prev => prev.filter(id => id !== expenseId));
      toast.success('Expense deleted successfully!');
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteSelected = async () => {
    try {
      // Delete all selected expenses
      const deletePromises = selectedExpenses.map(id => deleteExpense(id));
      await Promise.all(deletePromises);
      
      // Clear selection
      setSelectedExpenses([]);
      toast.success(`${selectedExpenses.length} expense(s) deleted successfully!`);
    } catch (error) {
      console.error('Error deleting expenses:', error);
      toast.error('Failed to delete some expenses. Please try again.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <CardTitle>Overdue Expenses</CardTitle>
            <CardDescription>
              Expenses marked as overdue by users
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm text-muted-foreground">
            {overdueExpenses.length} expense{overdueExpenses.length !== 1 ? 's' : ''} marked as overdue
          </p>
          {selectedExpenses.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected ({selectedExpenses.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete {selectedExpenses.length} selected expense{selectedExpenses.length !== 1 ? 's' : ''}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteSelected}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
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
                <TableHead>Client</TableHead>
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
                      </TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{expense.clientName || 'N/A'}</TableCell>
                      <TableCell>{expense.company || 'N/A'}</TableCell>
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
      </CardContent>
    </Card>
  );
};

export default OverdueExpenses;