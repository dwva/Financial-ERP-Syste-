import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AlertTriangle, FileText, Image as ImageIcon, Eye, Edit } from 'lucide-react';
import { toast } from 'react-toastify';
import EditExpenseForm from '@/components/user/EditExpenseForm';

const OverdueExpenses = () => {
  const { user } = useAuth();
  const { expenses, deleteExpense } = useData();
  const [overdueExpenses, setOverdueExpenses] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Filter expenses for current user that are marked as overdue
  useEffect(() => {
    if (user?.email) {
      const userOverdueExpenses = expenses.filter(expense => 
        expense.userId === user.email && expense.overdue === true
      );
      setOverdueExpenses(userOverdueExpenses);
    }
  }, [expenses, user?.email]);

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

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      setDeletingId(expenseId);
      await deleteExpense(expenseId);
      toast.success('Expense deleted successfully!');
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditExpense = (expense: any) => {
    setEditingExpense(expense);
    setIsEditDialogOpen(true);
  };

  const handleEditCancel = () => {
    setIsEditDialogOpen(false);
    setEditingExpense(null);
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    setEditingExpense(null);
    toast.success('Expense updated successfully!');
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <CardTitle>My Overdue Expenses</CardTitle>
              <CardDescription>
                Expenses that have been marked as overdue
              </CardDescription>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {overdueExpenses.length} expense{overdueExpenses.length !== 1 ? 's' : ''} marked as overdue
          </p>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
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
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No overdue expenses found
                    </TableCell>
                  </TableRow>
                ) : (
                  overdueExpenses.map((expense) => {
                    const daysOverdue = calculateDaysOverdue(expense.date, expense.overdueDays);
                    
                    return (
                      <TableRow key={expense.id}>
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
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditExpense(expense)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the expense 
                                    with amount {formatAmount(expense.amount)}.
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
        </CardContent>
      </Card>

      {/* Edit Expense Dialog */}
      {editingExpense && (
        <EditExpenseForm
          expense={editingExpense}
          onCancel={handleEditCancel}
          onSave={handleEditSuccess}
        />
      )}
    </>
  );
};

export default OverdueExpenses;