import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { TrendingUp, DollarSign, Users, Receipt, Filter, Calendar, Building, Briefcase, Clock, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const FinancialOverview = () => {
  const { expenses, employees } = useData();
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterSector, setFilterSector] = useState<string>('all');

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

  // Get unique sectors from employees
  const uniqueSectors = useMemo(() => {
    const sectors = new Set<string>();
    employees.forEach(employee => {
      if (employee.sector) {
        sectors.add(employee.sector);
      }
    });
    return Array.from(sectors).sort();
  }, [employees]);

  // Filter expenses based on selected filters
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.timestamp);
      const expenseMonth = expenseDate.toLocaleDateString('en-US', { month: 'long' });
      const expenseYear = expenseDate.getFullYear().toString();
      
      // Find employee for this expense to check sector
      const employee = employees.find(emp => emp.email === expense.userId);
      const sectorMatch = filterSector === 'all' || (employee && employee.sector === filterSector);
      
      const monthMatch = filterMonth === 'all' || expenseMonth === filterMonth;
      const yearMatch = filterYear === 'all' || expenseYear === filterYear;
      
      return monthMatch && yearMatch && sectorMatch;
    });
  }, [expenses, employees, filterMonth, filterYear, filterSector]);

  // Calculate financial metrics
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const avgExpense = filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0;
  const totalEmployees = employees.length;
  
  // Calculate expense status counts
  const pendingExpenses = filteredExpenses.filter(expense => (expense.status || 'pending') === 'pending').length;
  const receivedExpenses = filteredExpenses.filter(expense => expense.status === 'received').length;
  
  // Group expenses by user
  const expensesByUser = useMemo(() => {
    return filteredExpenses.reduce((acc, expense) => {
      const employee = employees.find(emp => emp.email === expense.userId);
      const userName = employee ? (employee.name || employee.email.split('@')[0]) : expense.userId.split('@')[0];
      const existing = acc.find(item => item.name === userName);
      if (existing) {
        existing.value += expense.amount;
      } else {
        acc.push({ name: userName, value: expense.amount });
      }
      return acc;
    }, [] as { name: string; value: number }[]);
  }, [filteredExpenses, employees]);

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

  // Group expenses by sector
  const expensesBySector = useMemo(() => {
    return filteredExpenses.reduce((acc, expense) => {
      const employee = employees.find(emp => emp.email === expense.userId);
      const sector = employee && employee.sector ? employee.sector : 'Unassigned';
      const existing = acc.find(item => item.name === sector);
      if (existing) {
        existing.value += expense.amount;
      } else {
        acc.push({ name: sector, value: expense.amount });
      }
      return acc;
    }, [] as { name: string; value: number }[]);
  }, [filteredExpenses, employees]);

  // Calculate monthly trend data
  const monthlyTrendData = useMemo(() => {
    const trendData: { month: string; amount: number; count: number }[] = [];
    
    // Group by month
    filteredExpenses.forEach(expense => {
      const month = new Date(expense.timestamp).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const existing = trendData.find(item => item.month === month);
      if (existing) {
        existing.amount += expense.amount;
        existing.count += 1;
      } else {
        trendData.push({ month, amount: expense.amount, count: 1 });
      }
    });
    
    return trendData.sort((a, b) => {
      const [aMonth, aYear] = a.month.split(' ');
      const [bMonth, bYear] = b.month.split(' ');
      if (aYear !== bYear) return parseInt(bYear) - parseInt(aYear);
      return new Date(`${aMonth} 1, ${aYear}`).getTime() - new Date(`${bMonth} 1, ${bYear}`).getTime();
    });
  }, [filteredExpenses]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const clearFilters = () => {
    setFilterMonth('all');
    setFilterYear('all');
    setFilterSector('all');
  };

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Financial Filters
          </CardTitle>
          <CardDescription>Filter financial data by month, year, or sector</CardDescription>
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
              <label className="text-sm font-medium mb-1 block">Sector</label>
              <Select value={filterSector} onValueChange={setFilterSector}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sectors</SelectItem>
                  {uniqueSectors.map(sector => (
                    <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="gap-2">
                <Filter className="w-4 h-4" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">{formatAmount(totalExpenses)}</div>
            <p className="text-xs text-blue-600">Filtered financial data</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Expense</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">{formatAmount(avgExpense)}</div>
            <p className="text-xs text-green-600">Per transaction</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Receipt className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-800">{filteredExpenses.length}</div>
            <p className="text-xs text-amber-600">Filtered data</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <Users className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">{totalEmployees}</div>
            <p className="text-xs text-purple-600">Total staff members</p>
          </CardContent>
        </Card>
      </div>

      {/* Expense Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Expenses</CardTitle>
            <Clock className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-800">{pendingExpenses}</div>
            <p className="text-xs text-yellow-600">Awaiting approval</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Received Expenses</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">{receivedExpenses}</div>
            <p className="text-xs text-green-600">Approved and processed</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {/* Monthly Expenses Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Monthly Expenses Trend
            </CardTitle>
            <CardDescription>Expense trends over time</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrendData}>
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
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    name="Expense Amount" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No expense data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expenses by Month Bar Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="w-5 h-5" />
              Expenses by Month
            </CardTitle>
            <CardDescription>Monthly expense distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {expensesByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={expensesByMonth}>
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
                  <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No expense data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expenses by Employee Pie Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Expenses by Employee
            </CardTitle>
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
                    labelLine={true}
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

        {/* Expenses by Sector Pie Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Expenses by Sector
            </CardTitle>
            <CardDescription>Distribution across company sectors</CardDescription>
          </CardHeader>
          <CardContent>
            {expensesBySector.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expensesBySector}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expensesBySector.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
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

export default FinancialOverview;