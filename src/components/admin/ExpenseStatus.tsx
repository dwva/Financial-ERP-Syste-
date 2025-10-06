import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'react-toastify';
import { FileText, Image as ImageIcon, CheckCircle, Clock } from 'lucide-react';

const ExpenseStatus = () => {
  const { expenses, employees, updateExpense } = useData();
  const [statusFilter, setStatusFilter] = useState<string>('all');

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
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleStatusChange = async (expenseId: string, newStatus: string) => {
    try {
      await updateExpense(expenseId, { status: newStatus });
      toast.success('Expense status updated successfully!');
    } catch (error) {
      console.error('Error updating expense status:', error);
      toast.error('Failed to update expense status. Please try again.');
    }
  };

  const filteredExpenses = statusFilter === 'all' 
    ? expenses 
    : expenses.filter(expense => (expense.status || 'pending') === statusFilter);

  const pendingCount = expenses.filter(expense => (expense.status || 'pending') === 'pending').length;
  const receivedCount = expenses.filter(expense => expense.status === 'received').length;

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
            </div>
          </div>
          
          {/* Status Filter */}
          <div className="flex gap-4">
            <div className="w-40">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                <TableHead>Sector</TableHead>
                <TableHead>File</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No expenses found
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((expense) => {
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
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(expense.status || 'pending')}
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={expense.status || 'pending'} 
                          onValueChange={(value) => handleStatusChange(expense.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="received">Received</SelectItem>
                          </SelectContent>
                        </Select>
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

export default ExpenseStatus;