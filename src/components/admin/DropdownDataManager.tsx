import { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'react-toastify';
import { useData } from '@/contexts/DataContext';
import { PlusCircle, Trash2, Upload, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

const DataManagement = () => {
  const { dropdownData, addDropdownData, deleteDropdownData } = useData();
  const [newItem, setNewItem] = useState({ type: '', value: '' });
  const [filterType, setFilterType] = useState('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Filter dropdown data by type
  const filteredData = useMemo(() => {
    if (filterType === 'all') return dropdownData;
    return dropdownData.filter(item => item.type === filterType);
  }, [dropdownData, filterType]);

  // Group data by type for easier management
  const groupedData = useMemo(() => {
    const groups: Record<string, any[]> = {
      company: [],
      client: [],
      candidate: [],
      sector: []
    };
    
    dropdownData.forEach(item => {
      if (groups[item.type]) {
        groups[item.type].push(item);
      }
    });
    
    return groups;
  }, [dropdownData]);

  const handleAddItem = async () => {
    if (!newItem.type || !newItem.value) {
      toast.error('Please select a type and enter a value');
      return;
    }
    
    try {
      await addDropdownData({
        type: newItem.type as 'company' | 'client' | 'candidate' | 'sector',
        value: newItem.value
      });
      
      toast.success('Item added successfully!');
      setNewItem({ type: '', value: '' });
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Failed to add item. Please try again.');
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteDropdownData(id);
      toast.success('Item deleted successfully!');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item. Please try again.');
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'company': return 'Company';
      case 'client': return 'Client';
      case 'candidate': return 'Candidate';
      case 'sector': return 'Sector';
      default: return type;
    }
  };

  // Handle Excel file import
  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit. Please choose a smaller file.');
      return;
    }

    setIsLoading(true);
    
    try {
      // Show processing message
      toast.info('Processing Excel file... This may take a moment for larger files.');
      
      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      
      // Parse Excel file
      const workbook = XLSX.read(data, { 
        type: 'array',
        cellDates: true,
        cellNF: false,
        cellText: false
      });
      
      // Get the first worksheet
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      
      // Convert to JSON with proper formatting
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '', // Default value for empty cells
        raw: false  // Parse dates and numbers properly
      });
      
      if (jsonData.length === 0) {
        toast.error('Excel file is empty or invalid');
        setIsLoading(false);
        return;
      }
      
      // Extract headers (first row)
      const headers: string[] = jsonData[0].map((header: any, index: number) => {
        if (header === null || header === undefined || header === '') {
          return `Column ${index + 1}`;
        }
        return String(header);
      });
      
      // Extract data rows (skip first row)
      const rows = jsonData.slice(1);
      
      // Validate data
      if (rows.length === 0) {
        toast.error('Excel file contains only headers. Please add data rows.');
        setIsLoading(false);
        return;
      }
      
      // Process data and import to dropdown
      let importedCount = 0;
      const errors: string[] = [];
      
      for (const row of rows) {
        // Expecting format: [Type, Value] or just [Value] with type selected
        if (row && row.length >= 1) {
          let type = newItem.type; // Use selected type if only value column
          let value = '';
          
          if (row.length >= 2) {
            // Format: [Type, Value]
            type = String(row[0]).trim().toLowerCase();
            value = String(row[1]).trim();
            
            // Map common type names
            if (type.includes('company')) type = 'company';
            else if (type.includes('client')) type = 'client';
            else if (type.includes('candidate')) type = 'candidate';
            else if (type.includes('sector')) type = 'sector';
            else type = 'company'; // Default to company
          } else {
            // Format: [Value] - use selected type
            value = String(row[0]).trim();
          }
          
          if (value) {
            try {
              await addDropdownData({
                type: type as 'company' | 'client' | 'candidate' | 'sector',
                value: value
              });
              importedCount++;
            } catch (error) {
              errors.push(`Row with value "${value}" failed to import`);
            }
          }
        }
      }
      
      // Show results
      if (importedCount > 0) {
        toast.success(`Successfully imported ${importedCount} items from Excel!`);
      }
      
      if (errors.length > 0) {
        toast.warn(`Failed to import ${errors.length} items. Check console for details.`);
        console.warn('Import errors:', errors);
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error reading Excel file:', error);
      toast.error('Failed to read Excel file. Please make sure it is a valid Excel file (.xlsx or .xls).');
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>Manage dropdown options and import data from Excel</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Add New Item Form */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Add New Item</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select value={newItem.type} onValueChange={(value) => setNewItem({...newItem, type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="candidate">Candidate</SelectItem>
                    <SelectItem value="sector">Sector</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="value">Value *</Label>
                <Input
                  id="value"
                  placeholder="Enter value"
                  value={newItem.value}
                  onChange={(e) => setNewItem({...newItem, value: e.target.value})}
                />
              </div>
              
              <Button onClick={handleAddItem} className="w-full">
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>
          
          {/* Excel Import Section */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Excel Import</h3>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <FileSpreadsheet className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-3">
                  Import dropdown data from Excel
                </p>
                <Button 
                  onClick={triggerFileInput} 
                  variant="outline" 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em]"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Select Excel File
                    </>
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelImport}
                  className="hidden"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Supported formats: .xlsx, .xls (Max 10MB)
                </p>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm font-medium text-blue-800">Expected Format:</p>
                <p className="text-xs text-blue-700 mt-1">
                  <strong>Option 1:</strong> Two columns - Type, Value<br/>
                  <strong>Option 2:</strong> One column - Value (uses selected type above)<br/><br/>
                  Example:<br/>
                  company, ABC Corporation<br/>
                  client, XYZ Client<br/>
                  sector, Technology
                </p>
              </div>
            </div>
          </div>
          
          {/* Stats Overview */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Companies</p>
                <p className="text-2xl font-bold">{groupedData.company.length}</p>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Clients</p>
                <p className="text-2xl font-bold">{groupedData.client.length}</p>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Candidates</p>
                <p className="text-2xl font-bold">{groupedData.candidate.length}</p>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Sectors</p>
                <p className="text-2xl font-bold">{groupedData.sector.length}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filter and Data Table */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Manage Items</h3>
            <div className="w-40">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="company">Companies</SelectItem>
                  <SelectItem value="client">Clients</SelectItem>
                  <SelectItem value="candidate">Candidates</SelectItem>
                  <SelectItem value="sector">Sectors</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      No items found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{getTypeLabel(item.type)}</TableCell>
                      <TableCell>{item.value}</TableCell>
                      <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataManagement;