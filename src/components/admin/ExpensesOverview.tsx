import React, { useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, FileText, AlertTriangle, Receipt } from 'lucide-react';

const ExpensesOverview = () => {
  const { expenses, employees } = useData();

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

  // Group expenses into rows of 3 for desktop, 1 for mobile, 2 for tablet
  const groupedExpenses = useMemo(() => {
    // This will be handled dynamically in the render function for better responsiveness
    return expenses;
  }, [expenses]);

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
          {groupedExpenses.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 col-span-full">
              No expenses found
            </div>
          ) : (
            groupedExpenses.map((expense) => (
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
    </Card>
  );
};

export default ExpensesOverview;