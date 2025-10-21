import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { Receipt, FileText, Image as ImageIcon, Trash2, Edit, Eye, ArrowUpDown } from 'lucide-react';
import { toast } from 'react-toastify';
import EditExpenseForm from '@/components/user/EditExpenseForm';

const MyExpensesTable = () => {
  const { user } = useAuth();
  const { expenses, deleteExpense, refreshData } = useData();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [viewExpenseDialogOpen, setViewExpenseDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);

  const userExpenses = expenses.filter((expense) => expense.userId === user?.email);

  const getFileIcon = (fileName: string | null) => {
    if (!fileName) return <FileText className="w-4 h-4" />;
    if (fileName.match(/\.(jpg|jpeg|png|gif)$/i)) return <ImageIcon className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const totalExpenses = userExpenses.reduce((sum, expense) => sum + expense.amount, 0);

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Receipt className="w-5 h-5 text-accent" />
            </div>
            <div>
              <CardTitle>My Expenses</CardTitle>
              <CardDescription>Your expense history</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={refreshData} className="gap-2">
              <ArrowUpDown className="w-4 h-4" />
              Refresh
            </Button>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-accent">{formatAmount(totalExpenses)}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>File</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No expenses recorded yet. Add your first expense above!
                  </TableCell>
                </TableRow>
              ) : (
                userExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-mono text-xs">
                      {expense.id.substring(0, 6)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-semibold">
                        {formatAmount(expense.amount)}
                      </Badge>
                    </TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>{expense.company}</TableCell>
                    <TableCell>{expense.sector}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getFileIcon(expense.fileName)}
                        <span className="text-sm text-muted-foreground">
                          {expense.fileName || 'No file'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(expense.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingExpense(expense)}
                        className="gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedExpense(expense);
                          setViewExpenseDialogOpen(true);
                        }}
                        className="gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                      {user?.role === 'admin' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(expense.id)}
                          className="gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      
      {editingExpense && (
        <div className="mt-6">
          <EditExpenseForm 
            expense={editingExpense} 
            onCancel={() => setEditingExpense(null)}
            onSave={() => setEditingExpense(null)}
          />
        </div>
      )}
      
      {/* View Expense Dialog */}
      <AlertDialog open={viewExpenseDialogOpen} onOpenChange={setViewExpenseDialogOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Expense Details</AlertDialogTitle>
            <AlertDialogDescription>
              Full details of your expense
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedExpense && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium">{formatAmount(selectedExpense.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{new Date(selectedExpense.date).toLocaleDateString()}</p>
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
                  <p className="text-sm text-muted-foreground">ID</p>
                  <p className="font-mono text-sm">{selectedExpense.id}</p>
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
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your expense record.
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
    </Card>
  );
};

export default MyExpensesTable;