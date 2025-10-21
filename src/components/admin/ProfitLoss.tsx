import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ArrowUpDown, Filter, RefreshCw, CheckCircle, XCircle, Save, Calendar } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { toast } from 'react-toastify';
import { ProfitLossReport } from '@/contexts/DataContext';

const ProfitLoss = () => {
  const { expenses, invoiceHistory, refreshData, profitLossReports, addProfitLossReport } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [sortField, setSortField] = useState<'client' | 'revenue' | 'expenses' | 'profit'>('client');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expenseInvoiceMap, setExpenseInvoiceMap] = useState<Record<string, string>>({});
  const [savedInvoices, setSavedInvoices] = useState<Record<string, { invoiceNumber: string, amount: number }>>({});
  const [activeTab, setActiveTab] = useState<'current' | 'saved'>('current');

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

  // Handle invoice number change for an expense
  const handleInvoiceNumberChange = (expenseId: string, invoiceNumber: string) => {
    setExpenseInvoiceMap(prev => ({
      ...prev,
      [expenseId]: invoiceNumber
    }));
  };

  // Get invoice amount by invoice number
  const getInvoiceAmount = (invoiceNumber: string) => {
    if (!invoiceNumber) return 0;
    
    // Try exact match first
    let invoice = invoiceHistory.find(inv => inv.invoiceNumber === invoiceNumber);
    
    // If not found, try case-insensitive match
    if (!invoice) {
      invoice = invoiceHistory.find(inv => 
        inv.invoiceNumber.toLowerCase() === invoiceNumber.toLowerCase()
      );
    }
    
    // If still not found, try partial match (in case of extra spaces)
    if (!invoice) {
      invoice = invoiceHistory.find(inv => 
        inv.invoiceNumber.trim() === invoiceNumber.trim()
      );
    }
    
    console.log('Looking for invoice:', invoiceNumber);
    console.log('Found invoice:', invoice);
    console.log('Available invoices:', invoiceHistory.map(inv => inv.invoiceNumber));
    
    return invoice ? invoice.total : 0;
  };

  // Calculate profit/loss data for each expense
  const profitLossData = useMemo(() => {
    return filteredExpenses.map(expense => {
      const invoiceNumber = expenseInvoiceMap[expense.id] || '';
      const revenue = invoiceNumber ? getInvoiceAmount(invoiceNumber) : 0;
      const profit = revenue - expense.amount;
      
      return {
        ...expense,
        invoiceNumber,
        revenue,
        profit
      };
    });
  }, [filteredExpenses, expenseInvoiceMap, invoiceHistory]);

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

  // Save invoice number and amount for an expense
  const handleSaveInvoice = (expenseId: string, invoiceNumber: string) => {
    if (!invoiceNumber) {
      toast.error('Please enter an invoice number first');
      return;
    }
    
    const amount = getInvoiceAmount(invoiceNumber);
    if (amount <= 0) {
      toast.error('Invoice not found or has invalid amount');
      return;
    }
    
    setSavedInvoices(prev => ({
      ...prev,
      [expenseId]: { invoiceNumber, amount }
    }));
    
    toast.success('Invoice saved successfully!');
  };

  // Save current profit/loss data as a report
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
      // Only include month if it's not 'all'
      const report: Omit<ProfitLossReport, 'id' | 'createdAt'> = {
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
      toast.success('Profit/Loss report saved successfully!');
    } catch (error: any) {
      console.error('Error saving report:', error);
      toast.error(`Failed to save report: ${error.message || 'Unknown error'}`);
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
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else if (profit < 0) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    return <CheckCircle className="w-4 h-4 text-gray-500" />;
  };

  // Filter saved reports by month and year
  const filteredReports = useMemo(() => {
    return profitLossReports.filter(report => {
      if (filterMonth !== 'all' && report.month !== filterMonth) {
        return false;
      }
      
      if (filterYear !== 'all' && report.year !== filterYear) {
        return false;
      }
      
      return true;
    });
  }, [profitLossReports, filterMonth, filterYear]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <ArrowUpDown className="w-5 h-5 text-accent" />
              </div>
              <div>
                <CardTitle>Profit & Loss</CardTitle>
                <CardDescription>
                  Link expenses to invoices for profit calculation
                </CardDescription>
              </div>
            </div>
            <Button 
              onClick={handleRefresh}
              variant="outline" 
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          </div>
          
          {/* Tabs for current data and saved reports */}
          <div className="flex border-b">
            <Button
              variant={activeTab === 'current' ? 'default' : 'ghost'}
              className="rounded-b-none"
              onClick={() => setActiveTab('current')}
            >
              Current Data
            </Button>
            <Button
              variant={activeTab === 'saved' ? 'default' : 'ghost'}
              className="rounded-b-none"
              onClick={() => setActiveTab('saved')}
            >
              Saved Reports
            </Button>
          </div>
          
          {/* Filter Section */}
          <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by client, company, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="w-40">
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="All months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All months</SelectItem>
                  {uniqueMonths.map(month => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-40">
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger>
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {uniqueYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={clearFilters} className="gap-2">
                <Filter className="w-4 h-4" />
                Clear Filters
              </Button>
              
              {activeTab === 'current' && (
                <Button onClick={handleSaveReport} className="gap-2">
                  <Save className="w-4 h-4" />
                  Save Report
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {activeTab === 'current' ? (
          <>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSort('expenses')}
                        className="gap-1 hover:bg-transparent w-full justify-end"
                      >
                        Expense Amount
                        <ArrowUpDown className="w-3 h-3" />
                      </Button>
                    </TableHead>
                    <TableHead>Invoice Number</TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSort('revenue')}
                        className="gap-1 hover:bg-transparent w-full justify-end"
                      >
                        Revenue
                        <ArrowUpDown className="w-3 h-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSort('profit')}
                        className="gap-1 hover:bg-transparent w-full justify-end"
                      >
                        Profit/Loss
                        <ArrowUpDown className="w-3 h-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.length > 0 ? (
                    <>
                      {sortedData.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.clientName || 'N/A'}</TableCell>
                          <TableCell>{item.company || 'N/A'}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">{formatAmount(item.amount)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Input
                                type="text"
                                placeholder="Enter invoice number"
                                value={item.invoiceNumber}
                                onChange={(e) => handleInvoiceNumberChange(item.id, e.target.value)}
                                className="w-32"
                              />
                              {item.invoiceNumber && (
                                <div className={`w-3 h-3 rounded-full ${getInvoiceAmount(item.invoiceNumber) > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleSaveInvoice(item.id, item.invoiceNumber)}
                                className={`p-2 h-8 ${savedInvoices[item.id] ? 'bg-green-100 border-green-500' : ''}`}
                                title="Save invoice"
                              >
                                <Save className="w-3 h-3" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleRefresh}
                                className="p-2 h-8"
                                title="Refresh data"
                              >
                                <RefreshCw className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{formatAmount(item.revenue)}</TableCell>
                          <TableCell className={`text-right font-medium ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
                        <TableCell colSpan={3}>Total</TableCell>
                        <TableCell className="text-right">{formatAmount(totals.expenses)}</TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-right">{formatAmount(totals.revenue)}</TableCell>
                        <TableCell className={`text-right ${totals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No expenses found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Saved Invoices Section */}
            {Object.keys(savedInvoices).length > 0 && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-2">Saved Invoices</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Expense Description</TableHead>
                        <TableHead>Client Name</TableHead>
                        <TableHead>Invoice Number</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(savedInvoices).map(([expenseId, invoiceData]) => {
                        const expense = expenses.find(exp => exp.id === expenseId);
                        return (
                          <TableRow key={expenseId}>
                            <TableCell>{expense?.description || 'N/A'}</TableCell>
                            <TableCell>{expense?.clientName || 'N/A'}</TableCell>
                            <TableCell>{invoiceData.invoiceNumber}</TableCell>
                            <TableCell className="text-right">{formatAmount(invoiceData.amount)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Profit & Loss Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded border">
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-lg font-bold text-green-600">{formatAmount(totals.revenue)}</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-lg font-bold text-red-600">{formatAmount(totals.expenses)}</p>
                </div>
                <div className={`bg-white p-3 rounded border ${totals.profit >= 0 ? 'border-green-500' : 'border-red-500'}`}>
                  <p className="text-sm text-muted-foreground">Net Profit/Loss</p>
                  <p className={`text-lg font-bold ${totals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatAmount(totals.profit)}
                  </p>
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                <p><strong>How it works:</strong> Enter invoice numbers for each expense to link them to revenue. Profit/Loss = Revenue - Expense.</p>
              </div>
            </div>
          </>
        ) : (
          // Saved Reports Tab
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Expenses</TableHead>
                  <TableHead className="text-right">Profit/Loss</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Date Saved</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.length > 0 ? (
                  filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium capitalize">{report.period}</TableCell>
                      <TableCell>{report.month || 'N/A'}</TableCell>
                      <TableCell>{report.year}</TableCell>
                      <TableCell className="text-right text-green-600">{formatAmount(report.revenue)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatAmount(report.expenses)}</TableCell>
                      <TableCell className={`text-right font-medium ${report.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatAmount(report.profit)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          {getStatusIcon(report.profit)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(report.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No saved reports found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            
            {filteredReports.length > 0 && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-2">Summary of Saved Reports</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-muted-foreground">Total Saved Reports</p>
                    <p className="text-lg font-bold">{filteredReports.length}</p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-muted-foreground">Average Revenue</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatAmount(filteredReports.reduce((sum, report) => sum + report.revenue, 0) / filteredReports.length)}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-muted-foreground">Average Profit</p>
                    <p className={`text-lg font-bold ${filteredReports.reduce((sum, report) => sum + report.profit, 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatAmount(filteredReports.reduce((sum, report) => sum + report.profit, 0) / filteredReports.length)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfitLoss;