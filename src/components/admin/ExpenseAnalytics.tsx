import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, DollarSign, Users, Receipt, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ExpenseAnalytics = () => {
  const { expenses, employees } = useData();
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterEmployee, setFilterEmployee] = useState<string>('all');

  // Get unique months and years from expenses
  const uniqueMonths = useMemo(() => {
    const months = new Set<string>();
    expenses.forEach(expense => {
      const date = new Date(expense.timestamp);
      const month = date.toLocaleDateString('en-US', { month: 'long' });
      months.add(month);
    });
    return Array.from(months).sort();
  }, [expenses]);

  const uniqueYears = useMemo(() => {
    const years = new Set<string>();
    expenses.forEach(expense => {
      const date = new Date(expense.timestamp);
      const year = date.getFullYear().toString();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [expenses]);

  // Filter expenses based on selected filters
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.timestamp);
      const expenseMonth = expenseDate.toLocaleDateString('en-US', { month: 'long' });
      const expenseYear = expenseDate.getFullYear().toString();
      
      const monthMatch = filterMonth === 'all' || expenseMonth === filterMonth;
      const yearMatch = filterYear === 'all' || expenseYear === filterYear;
      const employeeMatch = filterEmployee === 'all' || expense.userId === filterEmployee;
      
      return monthMatch && yearMatch && employeeMatch;
    });
  }, [expenses, filterMonth, filterYear, filterEmployee]);

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const avgExpense = filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0;

  // Group expenses by user
  const expensesByUser = useMemo(() => {
    return filteredExpenses.reduce((acc, expense) => {
      const existing = acc.find(item => item.name === expense.userId);
      if (existing) {
        existing.value += expense.amount;
      } else {
        acc.push({ name: expense.userId.split('@')[0], value: expense.amount });
      }
      return acc;
    }, [] as { name: string; value: number }[]);
  }, [filteredExpenses]);

  // Group expenses by month
  const expensesByMonth = useMemo(() => {
    return filteredExpenses.reduce((acc, expense) => {
      const month = new Date(expense.timestamp).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const existing = acc.find(item => item.month === month);
      if (existing) {
        existing.amount += expense.amount;
      } else {
        acc.push({ month, amount: expense.amount });
      }
      return acc;
    }, [] as { month: string; amount: number }[]);
  }, [filteredExpenses]);

  // Group expenses by client monthly
  const expensesByClientMonthly = useMemo(() => {
    // Filter for January - June 2024
    const janJun2024Expenses = expenses.filter(expense => {
      const date = new Date(expense.timestamp);
      const year = date.getFullYear();
      const month = date.getMonth(); // 0-11 (0 = January)
      return year === 2024 && month >= 0 && month <= 5; // January (0) to June (5)
    });
    
    // Group by client and month
    const result: { clientName: string; month: string; amount: number }[] = [];
    
    janJun2024Expenses.forEach(expense => {
      const clientName = expense.clientName || 'No Client';
      const date = new Date(expense.timestamp);
      const month = date.toLocaleDateString('en-US', { month: 'short' }); // Jan, Feb, etc.
      
      const existing = result.find(item => item.clientName === clientName && item.month === month);
      if (existing) {
        existing.amount += expense.amount;
      } else {
        result.push({ clientName, month, amount: expense.amount });
      }
    });
    
    return result;
  }, [expenses]);
  
  // Get unique clients for the bar chart
  const uniqueClients = useMemo(() => {
    return Array.from(new Set(expensesByClientMonthly.map(item => item.clientName)));
  }, [expensesByClientMonthly]);
  
  // Get unique months for the bar chart
  const chartMonths = useMemo(() => {
    return Array.from(new Set(expensesByClientMonthly.map(item => item.month))).sort((a, b) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      return months.indexOf(a) - months.indexOf(b);
    });
  }, [expensesByClientMonthly]);
  
  // Prepare data for the bar chart
  const barChartData = useMemo(() => {
    return chartMonths.map(month => {
      const data: any = { month };
      uniqueClients.forEach(client => {
        const item = expensesByClientMonthly.find(i => i.clientName === client && i.month === month);
        data[client] = item ? item.amount : 0;
      });
      return data;
    });
  }, [chartMonths, uniqueClients, expensesByClientMonthly]);

  const COLORS = ['hsl(214 84% 56%)', 'hsl(152 69% 31%)', 'hsl(38 92% 50%)', 'hsl(0 84% 60%)', 'hsl(142 76% 36%)'];

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const clearFilters = () => {
    setFilterMonth('all');
    setFilterYear('all');
    setFilterEmployee('all');
  };

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
          <CardDescription>Filter analytics data by month, year, or employee</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-40">
              <label className="text-sm font-medium mb-1 block">Month</label>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {uniqueMonths.map(month => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-40">
              <label className="text-sm font-medium mb-1 block">Year</label>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {uniqueYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-40">
              <label className="text-sm font-medium mb-1 block">Employee</label>
              <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.email}>
                      {employee.name || employee.email.split('@')[0]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatAmount(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">Filtered data</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Expense</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{formatAmount(avgExpense)}</div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{filteredExpenses.length}</div>
            <p className="text-xs text-muted-foreground">Filtered data</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{employees.length}</div>
            <p className="text-xs text-muted-foreground">Total users</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {/* Bar Chart - Expenses by Client Monthly */}
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Client</CardTitle>
            <CardDescription>January - June 2024</CardDescription>
          </CardHeader>
          <CardContent>
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    formatter={(value: number) => formatAmount(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  {uniqueClients.map((client, index) => (
                    <Bar 
                      key={client} 
                      dataKey={client} 
                      fill={COLORS[index % COLORS.length]} 
                      radius={[4, 4, 0, 0]} 
                      name={client}
                    />
                  ))}
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No expense data available for Jan-Jun 2024
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart - Expenses by Employee */}
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Employee</CardTitle>
            <CardDescription>Distribution across team members</CardDescription>
          </CardHeader>
          <CardContent>
            {expensesByUser.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expensesByUser}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expensesByUser.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatAmount(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No expense data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExpenseAnalytics;