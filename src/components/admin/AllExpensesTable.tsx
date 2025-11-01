import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Receipt, FileText, Image as ImageIcon, AlertTriangle, Download, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

const AllExpensesTable = () => {
  const { expenses, employees, deleteExpense } = useData();
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);

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
                          <span className="text-sm text-muted-foreground">
                            {expense.fileName || 'No file'}
                          </span>
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
      </CardContent>
    </Card>
  );
};

export default AllExpensesTable;