import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Receipt, FileText, Image as ImageIcon, AlertTriangle, Eye, Download } from 'lucide-react';

const AllExpensesTable = () => {
  const { expenses, employees } = useData();
  const [viewFileDialogOpen, setViewFileDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{url: string, name: string} | null>(null);

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Receipt className="w-5 h-5 text-accent" />
          </div>
          <div>
            <CardTitle>All Expenses</CardTitle>
            <CardDescription>View all employee expenses</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
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
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No expenses recorded yet
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense) => {
                  const employee = employees.find(emp => emp.email === expense.userId);
                  return (
                    <TableRow key={expense.id}>
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
                        {expense.fileName ? (
                          <div className="flex items-center gap-2">
                            {getFileIcon(expense.fileName)}
                            <span className="text-sm text-muted-foreground truncate max-w-[120px]">
                              {expense.fileName}
                            </span>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (expense.file) {
                                    setSelectedFile({ url: expense.file, name: expense.fileName });
                                    setViewFileDialogOpen(true);
                                  }
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (expense.file) {
                                    const link = document.createElement('a');
                                    link.href = expense.file;
                                    link.download = expense.fileName || 'file';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <Download className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No file</span>
                        )}
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
      </CardContent>
      
      {/* File View Dialog */}
      <Dialog open={viewFileDialogOpen} onOpenChange={setViewFileDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>File Preview</DialogTitle>
          </DialogHeader>
          {selectedFile && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">{selectedFile.name}</p>
              {selectedFile.name.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <img 
                  src={selectedFile.url} 
                  alt="File preview" 
                  className="max-w-full h-auto rounded-lg border"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 bg-muted rounded-lg">
                  <FileText className="w-12 h-12 text-muted-foreground mb-2" />
                  <p className="text-center">File preview not available for this file type</p>
                  <Button 
                    className="mt-4"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = selectedFile.url;
                      link.download = selectedFile.name;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download File
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AllExpensesTable;