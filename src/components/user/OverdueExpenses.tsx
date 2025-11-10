import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Edit, 
  Eye,
  FileText, 
  Image as ImageIcon,
  X,
  Download
} from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import EditExpenseForm from './EditExpenseForm';
import { toast } from 'react-toastify';

// File viewer modal component
const FileViewerModal = ({ 
  isOpen, 
  onClose, 
  fileUrl, 
  fileName 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  fileUrl: string; 
  fileName: string; 
}) => {
  if (!isOpen) return null;

  const isImage = fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i);
  const isPdf = fileName.match(/\.pdf$/i);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold truncate">{fileName}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {isImage ? (
            <div className="flex justify-center">
              <img 
                src={fileUrl} 
                alt={fileName} 
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          ) : isPdf ? (
            <div className="flex justify-center">
              <iframe 
                src={fileUrl} 
                className="w-full h-[70vh]"
                title={fileName}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center">
              <FileText className="w-16 h-16 text-gray-400 mb-4" />
              <p className="mb-4">This file type cannot be previewed directly.</p>
              <Button onClick={() => window.open(fileUrl, '_blank')}>
                <Download className="w-4 h-4 mr-2" />
                Download File
              </Button>
            </div>
          )}
        </div>
        <div className="p-4 border-t flex justify-end">
          <Button onClick={() => window.open(fileUrl, '_blank')}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
};

const OverdueExpenses = () => {
  const { expenses, deleteExpense } = useData();
  const { user } = useAuth();
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [fileViewerOpen, setFileViewerOpen] = useState<boolean>(false);
  const [currentFile, setCurrentFile] = useState<{ url: string; name: string } | null>(null);

  // Filter for user's overdue expenses
  const overdueExpenses = useMemo(() => {
    if (!user?.email) return [];
    
    const now = new Date();
    return expenses
      .filter(expense => 
        expense.userId === user.email && 
        expense.overdue
      )
      .filter(expense => {
        // Check if the expense is actually overdue based on date and overdueDays
        if (expense.overdueDays) {
          const expenseDate = new Date(expense.date);
          const dueDate = new Date(expenseDate);
          dueDate.setDate(expenseDate.getDate() + parseInt(expense.overdueDays));
          return dueDate < now;
        }
        
        return true;
      });
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

  const handleEditExpense = (expense: any) => {
    setEditingExpense(expense);
  };

  const handleEditCancel = () => {
    setEditingExpense(null);
  };

  const handleEditSuccess = () => {
    setEditingExpense(null);
    toast.success('Expense updated successfully');
  };

  const handleDeleteExpense = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteExpense(id);
      toast.success('Expense deleted successfully');
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    } finally {
      setDeletingId(null);
    }
  };

  // Function to view a file in modal
  const handleViewFile = async (fileUrl: string, fileName: string) => {
    try {
      // For expense attachments, they should be accessible via /admin-attachments/ path
      // But for user expenses, we need to use /message-attachments/ path
      const correctedFileUrl = fileUrl.replace('/admin-attachments/', '/message-attachments/');
      setCurrentFile({ url: correctedFileUrl, name: fileName });
      setFileViewerOpen(true);
    } catch (error) {
      console.error('Error preparing file for viewing:', error);
      toast.error('Failed to view file. Please try downloading instead.');
    }
  };

  if (!user) return null;

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
                            {expense.fileName ? (
                              <div className="flex items-center gap-1">
                                <span className="text-sm text-muted-foreground">
                                  {expense.fileName}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewFile(expense.file, expense.fileName!)}
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
      
      {/* File Viewer Modal */}
      <FileViewerModal 
        isOpen={fileViewerOpen}
        onClose={() => setFileViewerOpen(false)}
        fileUrl={currentFile?.url || ''}
        fileName={currentFile?.name || ''}
      />
    </>
  );
};

export default OverdueExpenses;