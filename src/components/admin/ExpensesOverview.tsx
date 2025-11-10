import React, { useMemo, useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, FileText, AlertTriangle, Receipt, Eye, Download, X } from 'lucide-react';

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

const ExpensesOverview = () => {
  const { expenses, employees } = useData();
  const [fileViewerOpen, setFileViewerOpen] = useState<boolean>(false);
  const [currentFile, setCurrentFile] = useState<{ url: string; name: string } | null>(null);

  // Get user name for an expense
  const getUserName = (userId: string) => {
    const employee = employees.find(emp => emp.email === userId);
    return employee ? employee.name || userId.split('@')[0] : 'Unknown User';
  };

  // Check if expense is overdue
  const isOverdue = (expense: any) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const expenseDate = new Date(expense.date);
    const isOverdue = expenseDate < thirtyDaysAgo;
    const isNotReceived = (expense.status || 'pending') !== 'received';
    return isOverdue && isNotReceived;
  };

  // Format amount
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Handle file view in modal
  const handleViewFile = (fileUrl: string, fileName: string) => {
    if (fileUrl) {
      // Open file in modal instead of new tab
      setCurrentFile({ url: fileUrl, name: fileName });
      setFileViewerOpen(true);
    }
  };

  // Handle file download
  const handleDownloadFile = async (fileUrl: string, fileName: string) => {
    if (fileUrl && fileName) {
      try {
        // Fetch the file
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        
        // Get the blob
        const blob = await response.blob();
        
        // Create a temporary link element
        const link = document.createElement('a');
        const url = window.URL.createObjectURL(blob);
        link.href = url;
        link.download = fileName || 'expense-attachment';
        
        // Add to document, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the URL object
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error downloading file:', error);
        // Fallback: open in new tab if download fails
        window.open(fileUrl, '_blank');
      }
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Expenses Overview</CardTitle>
            <CardDescription className="text-sm">
              Summary of all expenses with key details
            </CardDescription>
          </div>
        </div>
        <div className="mt-2">
          <p className="text-sm text-muted-foreground">
            {expenses.length} total expense{expenses.length !== 1 ? 's' : ''}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {expenses.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 col-span-full">
              No expenses found
            </div>
          ) : (
            expenses.map((expense) => (
              <div 
                key={expense.id} 
                className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-sm truncate text-foreground">{getUserName(expense.userId)}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(expense.date)}</p>
                  </div>
                  <div className="flex gap-1">
                    {isOverdue(expense) && (
                      <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                        <AlertTriangle className="w-3 h-3" />
                        <span className="hidden sm:inline">Overdue</span>
                      </Badge>
                    )}
                    {expense.hasInvoice ? (
                      <Badge className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1 text-xs">
                        <Receipt className="w-3 h-3" />
                        <span className="hidden sm:inline">Invoiced</span>
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                        <Receipt className="w-3 h-3" />
                        <span className="hidden sm:inline">No Invoice</span>
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="mt-3">
                  <p className="text-sm font-medium text-foreground">{formatAmount(expense.amount)}</p>
                  <p className="text-xs text-muted-foreground truncate mt-1">{expense.description}</p>
                </div>
                
                {/* File Attachment Section */}
                {(expense.file || expense.fileUrl) && (
                  <div className="mt-2 flex items-center justify-between bg-muted/50 p-2 rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                        {expense.fileName || 'Attachment'}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0"
                        onClick={() => handleViewFile(expense.file || expense.fileUrl, expense.fileName || 'expense-file')}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0"
                        onClick={() => handleDownloadFile(expense.file || expense.fileUrl, expense.fileName || 'expense-file')}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="mt-3 flex justify-between items-center">
                  <div>
                    {expense.status === 'received' ? (
                      <Badge className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1 text-xs">
                        <CheckCircle className="w-3 h-3" />
                        <span className="hidden sm:inline">Received</span>
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                        <Clock className="w-3 h-3" />
                        <span className="hidden sm:inline">Pending</span>
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate max-w-[40%]">
                    {expense.company || expense.clientName || 'N/A'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
      
      {/* File Viewer Modal */}
      <FileViewerModal 
        isOpen={fileViewerOpen}
        onClose={() => setFileViewerOpen(false)}
        fileUrl={currentFile?.url || ''}
        fileName={currentFile?.name || ''}
      />
    </Card>
  );
};

export default ExpensesOverview;