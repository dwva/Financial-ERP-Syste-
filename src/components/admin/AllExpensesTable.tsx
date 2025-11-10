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
  X
} from 'lucide-react';
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

const AllExpensesTable = () => {
  const { expenses, employees, deleteExpense } = useData();
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [fileViewerOpen, setFileViewerOpen] = useState<boolean>(false);
  const [currentFile, setCurrentFile] = useState<{ url: string; name: string } | null>(null);

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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedExpenses(expenses.map(expense => expense.id));
    } else {
      setSelectedExpenses([]);
    }
  };

  const handleSelectExpense = (expenseId: string, checked: boolean) => {
    if (checked) {
      setSelectedExpenses(prev => [...prev, expenseId]);
    } else {
      setSelectedExpenses(prev => prev.filter(id => id !== expenseId));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedExpenses.length === 0) return;
    
    try {
      for (const expenseId of selectedExpenses) {
        await deleteExpense(expenseId);
      }
      toast.success(`${selectedExpenses.length} expense(s) deleted successfully!`);
      setSelectedExpenses([]);
    } catch (error) {
      console.error('Error deleting expenses:', error);
      toast.error('Failed to delete expenses. Please try again.');
    }
  };

  const handleDownloadSelected = () => {
    if (selectedExpenses.length === 0) return;
    
    // In a real implementation, you would implement bulk download functionality
    toast.info('Bulk download functionality would be implemented here');
  };

  // Function to view a file in modal
  const handleViewFile = async (fileUrl: string, fileName: string) => {
    try {
      // For expense attachments, they should be accessible via /admin-attachments/ path
      const correctedFileUrl = fileUrl.replace('/message-attachments/', '/admin-attachments/');
      setCurrentFile({ url: correctedFileUrl, name: fileName });
      setFileViewerOpen(true);
    } catch (error) {
      console.error('Error preparing file for viewing:', error);
      toast.error('Failed to view file. Please try downloading instead.');
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
              <CardTitle>All Expenses</CardTitle>
              <CardDescription>View all employee expenses</CardDescription>
            </div>
          </div>
          {selectedExpenses.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedExpenses.length} selected
              </span>
              <Button variant="outline" size="sm" onClick={handleDownloadSelected}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
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
                    checked={selectedExpenses.length === expenses.length && expenses.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>File</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No expenses recorded yet
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense) => {
                  const employee = employees.find(emp => emp.email === expense.userId);
                  const isSelected = selectedExpenses.includes(expense.id);
                  
                  return (
                    <TableRow key={expense.id} className={isSelected ? 'bg-muted' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectExpense(expense.id, checked as boolean)}
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
                      <TableCell>{expense.company || 'N/A'}</TableCell>
                      <TableCell>{expense.clientName || 'N/A'}</TableCell>
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
                        {new Date(expense.timestamp).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {expense.overdue ? (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Overdue
                          </Badge>
                        ) : (
                          <Badge variant="default">Normal</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* File Viewer Modal */}
        <FileViewerModal 
          isOpen={fileViewerOpen}
          onClose={() => setFileViewerOpen(false)}
          fileUrl={currentFile?.url || ''}
          fileName={currentFile?.name || ''}
        />
      </CardContent>
    </Card>
  );
};

export default AllExpensesTable;