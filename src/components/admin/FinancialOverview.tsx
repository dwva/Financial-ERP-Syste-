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

// Add this import with the other imports
import { ChartPieSimple } from './ChartPieSimple';
import { ChartBarDefault } from './ChartBarDefault';
import { ChartAreaInteractive } from './ChartAreaInteractive';

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

  // Group expenses by date for the area chart
  const expensesByDate = useMemo(() => {
    const dateMap = new Map<string, { expenses: number; revenues: number }>();
    
    // Initialize with all dates in the filtered expenses
    filteredExpenses.forEach(expense => {
      const date = new Date(expense.timestamp).toISOString().split('T')[0]; // YYYY-MM-DD format
      if (!dateMap.has(date)) {
        dateMap.set(date, { expenses: 0, revenues: 0 });
      }
      const current = dateMap.get(date)!;
      dateMap.set(date, {
        ...current,
        expenses: current.expenses + expense.amount
      });
    });
    
    // Convert to array and sort by date
    const result = Array.from(dateMap.entries()).map(([date, amounts]) => ({
      date,
      ...amounts
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return result;
  }, [filteredExpenses]);

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
      <Card className="card-rounded">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Filter className="w-5 h-5 chart-violet" />
            Financial Filters
          </CardTitle>
          <CardDescription>Filter financial data by month, year, or sector</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-40">
              <label className="text-sm font-medium mb-1 block">Month</label>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="select-rounded">
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
                <SelectTrigger className="select-rounded">
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
                <SelectTrigger className="select-rounded">
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
              <Button variant="outline" onClick={clearFilters} className="gap-2 btn-rounded">
                <Filter className="w-4 h-4" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-violet-50 to-violet-100 border-violet-200 card-rounded">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-5 w-5 text-violet-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-800">{formatAmount(totalExpenses)}</div>
            <p className="text-xs text-violet-600">Filtered financial data</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 card-rounded">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Expense</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">{formatAmount(avgExpense)}</div>
            <p className="text-xs text-green-600">Per transaction</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 card-rounded">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Receipt className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-800">{filteredExpenses.length}</div>
            <p className="text-xs text-amber-600">Filtered data</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 card-rounded">
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
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 card-rounded">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Expenses</CardTitle>
            <Clock className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-800">{pendingExpenses}</div>
            <p className="text-xs text-yellow-600">Awaiting approval</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 card-rounded">
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
        {/* Interactive Expenses and Revenues Area Chart */}
        <div className="col-span-1 lg:col-span-2">
          <ChartAreaInteractive 
            data={expensesByDate}
            title="Expenses and Revenues Over Time"
            description="Showing expenses and revenues for the selected period"
          />
        </div>

        {/* Expenses by Employee Pie Chart - replaced with new design */}
        <div className="col-span-1">
          <ChartPieSimple 
            data={expensesByUser.map((item, index) => ({
              name: item.name,
              value: item.value
            }))}
            title="Expenses by Employee"
            description="Distribution across team members"
          />
        </div>

        {/* New Bar Chart Component - smaller size */}
        <div className="col-span-1 flex justify-center">
          <ChartBarDefault />
        </div>
      </div>
    </div>
  );
};

export default FinancialOverview;