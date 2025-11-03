import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ArrowUpDown, Filter, RefreshCw, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useNotification } from '@/contexts/NotificationContext';
import { toast } from 'react-toastify';

const ProfitLoss = () => {
  const { expenses, invoiceHistory, refreshData, addProfitLossReport } = useData();
  const { addNotification } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [sortField, setSortField] = useState<'client' | 'revenue' | 'expenses' | 'profit'>('client');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Get unique months and years from expenses
  const uniqueMonths = useMemo(() => {
    const months = new Set<string>();
    
    expenses.forEach(expense => {
      if (expense.timestamp) {
        const date = new Date(expense.timestamp);
        const month = date.toLocaleDateString('en-US', { month: 'long' });
        months.add(month);
      }
    });
    
    return Array.from(months).sort();
  }, [expenses]);

  const uniqueYears = useMemo(() => {
    const years = new Set<string>();
    
    expenses.forEach(expense => {
      if (expense.timestamp) {
        const date = new Date(expense.timestamp);
        const year = date.getFullYear().toString();
        years.add(year);
      }
    });
    
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [expenses]);

  // Find invoice for an expense based on matching criteria
  const findInvoiceForExpense = (expense: any) => {
    // Look for invoices that match the expense criteria
    return invoiceHistory.find(invoice => {
      // Match by company name
      if (expense.company && invoice.companyName) {
        return expense.company.toLowerCase() === invoice.companyName.toLowerCase();
      }
      
      // Match by candidate name
      if (expense.candidateName && invoice.candidateName) {
        return expense.candidateName.toLowerCase() === invoice.candidateName.toLowerCase();
      }
      
      return false;
    });
  };

  // Filter expenses by month and year
  const filteredExpenses = useMemo(() => {
    let filtered = [...expenses];
    
    if (filterMonth !== 'all') {
      filtered = filtered.filter(expense => {
        const date = new Date(expense.timestamp);
        const month = date.toLocaleDateString('en-US', { month: 'long' });
        return month === filterMonth;
      });
    }
    
    if (filterYear !== 'all') {
      filtered = filtered.filter(expense => {
        const date = new Date(expense.timestamp);
        const year = date.getFullYear().toString();
        return year === filterYear;
      });
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(expense => 
        (expense.clientName?.toLowerCase().includes(term) ||
        expense.company?.toLowerCase().includes(term) ||
        expense.description?.toLowerCase().includes(term))
      );
    }
    
    return filtered;
  }, [expenses, filterMonth, filterYear, searchTerm]);

  // Calculate profit/loss data for each expense
  const profitLossData = useMemo(() => {
    return filteredExpenses.map(expense => {
      let revenue = 0;
      let invoiceNumber = '';
      let revenueStatus = 'No Invoice';
      
      // If expense has an invoice, find it
      if (expense.hasInvoice) {
        const invoice = findInvoiceForExpense(expense);
        if (invoice) {
          invoiceNumber = invoice.invoiceNumber;
          
          // If expense status is received, use invoice total as revenue
          if (expense.status === 'received') {
            revenue = invoice.total;
            revenueStatus = 'Received';
          } else {
            // If expense status is pending, show as pending
            revenueStatus = 'Pending';
          }
        } else {
          // Has invoice flag but no matching invoice found
          revenueStatus = expense.status || 'pending';
        }
      } else {
        // If no invoice, show expense status
        revenueStatus = expense.status || 'pending';
      }
      
      const profit = revenue - expense.amount;
      
      return {
        ...expense,
        invoiceNumber,
        revenue,
        revenueStatus,
        profit
      };
    });
  }, [filteredExpenses, invoiceHistory]);

  // Sort data
  const sortedData = useMemo(() => {
    return [...profitLossData].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'client':
          comparison = (a.clientName || '').localeCompare(b.clientName || '');
          break;
        case 'revenue':
          comparison = a.revenue - b.revenue;
          break;
        case 'expenses':
          comparison = a.amount - b.amount;
          break;
        case 'profit':
          comparison = a.profit - b.profit;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [profitLossData, sortField, sortOrder]);

  // Calculate totals
  const totals = useMemo(() => {
    return sortedData.reduce(
      (acc, item) => {
        acc.revenue += item.revenue;
        acc.expenses += item.amount;
        acc.profit += item.profit;
        return acc;
      },
      { revenue: 0, expenses: 0, profit: 0 }
    );
  }, [sortedData]);

  // Save profit/loss report to database
  const handleSaveReport = async () => {
    try {
      // Prepare report data
      const reportData = sortedData.map(item => ({
        expenseId: item.id,
        clientName: item.clientName,
        company: item.company,
        description: item.description,
        expenseAmount: item.amount,
        invoiceNumber: item.invoiceNumber,
        revenue: item.revenue,
        profit: item.profit
      }));
      
      // Determine period based on filters
      const period: 'monthly' | 'yearly' = filterMonth !== 'all' ? 'monthly' : 'yearly';
      const year = filterYear !== 'all' ? filterYear : new Date().getFullYear().toString();
      
      // Create report object that matches the ProfitLossReport interface
      const report: any = {
        period,
        year,
        revenue: totals.revenue,
        expenses: totals.expenses,
        profit: totals.profit,
        reportData
      };
      
      // Only add month property if it's not 'all'
      if (filterMonth !== 'all') {
        report.month = filterMonth;
      }
      
      // Save to database
      await addProfitLossReport(report);
      
      // Add notification
      addNotification({
        title: 'Profit/Loss Report Saved',
        message: `Profit/Loss report for ${filterMonth !== 'all' ? filterMonth + ' ' : ''}${year} saved with total profit of ${new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: 2
        }).format(totals.profit)}`,
        type: 'profit_loss_updated'
      });
      
      toast.success('Profit/Loss report saved successfully!');
    } catch (error: any) {
      console.error('Error saving report:', error);
      toast.error(`Failed to save report: ${error.message || 'Unknown error'}`);
    }
  };

  const toggleSort = (field: 'client' | 'revenue' | 'expenses' | 'profit') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterMonth('all');
    setFilterYear('all');
  };

  const handleRefresh = async () => {
    try {
      await refreshData();
      toast.success('Data refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Get status icon and color
  const getStatusIcon = (profit: number) => {
    if (profit > 0) {
      return <CheckCircle className="w-4 h-4 text-primary" />;
    } else if (profit < 0) {
      return <XCircle className="w-4 h-4 text-destructive" />;
    }
    return <CheckCircle className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ArrowUpDown className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Profit & Loss</CardTitle>
                <CardDescription className="text-sm">
                  Automatic profit calculation from invoices and expense status
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={handleRefresh}
                variant="outline" 
                size="sm"
                className="text-sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </Button>
              <Button 
                onClick={handleSaveReport}
                size="sm"
                className="text-sm"
              >
                Save Report
              </Button>
            </div>
          </div>
          
          {/* Filter Section - Responsive */}
          <div className="flex flex-wrap gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  placeholder="Search by client, company, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full p-2 border rounded text-sm"
                />
              </div>
            </div>
            
            <div className="w-full sm:w-40">
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="All months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All months</SelectItem>
                  {uniqueMonths.map(month => (
                    <SelectItem key={month} value={month} className="text-sm">{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full sm:w-40">
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {uniqueYears.map(year => (
                    <SelectItem key={year} value={year} className="text-sm">{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={clearFilters} className="gap-2 text-sm">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Clear Filters</span>
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Client Name</TableHead>
                  <TableHead className="text-xs">Company</TableHead>
                  <TableHead className="text-xs">Description</TableHead>
                  <TableHead className="text-right text-xs">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSort('expenses')}
                      className="gap-1 hover:bg-transparent w-full justify-end p-1"
                    >
                      <span className="hidden md:inline">Expense Amount</span>
                      <span className="md:hidden">Amt</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-xs">Invoice</TableHead>
                  <TableHead className="text-right text-xs">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSort('revenue')}
                      className="gap-1 hover:bg-transparent w-full justify-end p-1"
                    >
                      <span className="hidden md:inline">Revenue</span>
                      <span className="md:hidden">Rev</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right text-xs">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSort('profit')}
                      className="gap-1 hover:bg-transparent w-full justify-end p-1"
                    >
                      <span className="hidden md:inline">Profit/Loss</span>
                      <span className="md:hidden">P/L</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-center text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.length > 0 ? (
                  <>
                    {sortedData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium text-foreground text-xs">{item.clientName || 'N/A'}</TableCell>
                        <TableCell className="text-foreground text-xs">{item.company || 'N/A'}</TableCell>
                        <TableCell className="text-foreground text-xs max-w-[150px] truncate">{item.description}</TableCell>
                        <TableCell className="text-right text-foreground text-xs">{formatAmount(item.amount)}</TableCell>
                        <TableCell className="text-foreground text-xs max-w-[100px] truncate">
                          {item.invoiceNumber || 'No Invoice'}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {item.revenueStatus === 'Received' ? (
                            <span className="text-primary font-medium">{formatAmount(item.revenue)}</span>
                          ) : (
                            <span className={item.revenueStatus === 'Pending' ? 'text-yellow-600' : 
                                     item.revenueStatus === 'received' ? 'text-primary' : 
                                     item.revenueStatus === 'pending' ? 'text-yellow-600' : 
                                     'text-muted-foreground'}>
                              {item.revenueStatus.charAt(0).toUpperCase() + item.revenueStatus.slice(1)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className={`text-right font-medium text-xs ${item.profit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                          {formatAmount(item.profit)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            {getStatusIcon(item.profit)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted font-bold">
                      <TableCell colSpan={3} className="text-xs">Total</TableCell>
                      <TableCell className="text-right text-foreground text-xs">{formatAmount(totals.expenses)}</TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-right text-foreground text-xs">{formatAmount(totals.revenue)}</TableCell>
                      <TableCell className={`text-right text-xs ${totals.profit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                        {formatAmount(totals.profit)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          {getStatusIcon(totals.profit)}
                        </div>
                      </TableCell>
                    </TableRow>
                  </>
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">
                      No expenses found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <h3 className="font-medium mb-2 text-sm">Profit & Loss Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded border">
              <p className="text-xs text-muted-foreground">Total Revenue</p>
              <p className="text-base font-bold text-primary">{formatAmount(totals.revenue)}</p>
            </div>
            <div className="bg-white p-3 rounded border">
              <p className="text-xs text-muted-foreground">Total Expenses</p>
              <p className="text-base font-bold text-destructive">{formatAmount(totals.expenses)}</p>
            </div>
            <div className={`bg-white p-3 rounded border ${totals.profit >= 0 ? 'border-primary' : 'border-destructive'}`}>
              <p className="text-xs text-muted-foreground">Net Profit/Loss</p>
              <p className={`text-base font-bold ${totals.profit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {formatAmount(totals.profit)}
              </p>
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            <p><strong>How it works:</strong> Revenue is calculated based on expense status. When an expense is marked as "received", the associated invoice amount is added to revenue. Profit/Loss = Revenue - Expense.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfitLoss;