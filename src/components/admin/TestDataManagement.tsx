import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2, Upload, FileSpreadsheet } from 'lucide-react';

// Mock data for testing (excluding sector)
const mockData = [
  { id: '1', type: 'company', value: 'ABC Corporation', createdAt: '2023-01-15' },
  { id: '2', type: 'company', value: 'XYZ Industries', createdAt: '2023-02-20' },
  { id: '3', type: 'client', value: 'Global Client', createdAt: '2023-03-10' },
  { id: '4', type: 'candidate', value: 'John Smith', createdAt: '2023-04-05' },
];

const TestDataManagement = () => {
  const [dropdownData] = useState(mockData);
  const [newItem, setNewItem] = useState({ type: '', value: '' });
  const [filterType, setFilterType] = useState('all');

  // Filter dropdown data by type
  const filteredData = filterType === 'all' 
    ? dropdownData 
    : dropdownData.filter(item => item.type === filterType);

  // Group data by type for easier management (excluding sector)
  const groupedData = {
    company: dropdownData.filter(item => item.type === 'company'),
    client: dropdownData.filter(item => item.type === 'client'),
    candidate: dropdownData.filter(item => item.type === 'candidate')
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'company': return 'Company';
      case 'client': return 'Client';
      case 'candidate': return 'Candidate';
      default: return type;
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
              
              <Button className="w-full">
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
                  variant="outline" 
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Select Excel File
                </Button>
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
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Grouped Data Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Companies */}
            <div className="border rounded-lg p-3 bg-white">
              <h4 className="font-medium text-blue-700 mb-2">Companies ({groupedData.company.length})</h4>
              <div className="max-h-60 overflow-y-auto">
                {groupedData.company.length > 0 ? (
                  <ul className="space-y-1">
                    {groupedData.company.map((item) => (
                      <li key={item.id} className="flex justify-between items-center text-sm">
                        <span className="truncate" title={item.value}>{item.value}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">No companies</p>
                )}
              </div>
            </div>
            
            {/* Clients */}
            <div className="border rounded-lg p-3 bg-white">
              <h4 className="font-medium text-green-700 mb-2">Clients ({groupedData.client.length})</h4>
              <div className="max-h-60 overflow-y-auto">
                {groupedData.client.length > 0 ? (
                  <ul className="space-y-1">
                    {groupedData.client.map((item) => (
                      <li key={item.id} className="flex justify-between items-center text-sm">
                        <span className="truncate" title={item.value}>{item.value}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">No clients</p>
                )}
              </div>
            </div>
            
            {/* Candidates */}
            <div className="border rounded-lg p-3 bg-white">
              <h4 className="font-medium text-purple-700 mb-2">Candidates ({groupedData.candidate.length})</h4>
              <div className="max-h-60 overflow-y-auto">
                {groupedData.candidate.length > 0 ? (
                  <ul className="space-y-1">
                    {groupedData.candidate.map((item) => (
                      <li key={item.id} className="flex justify-between items-center text-sm">
                        <span className="truncate" title={item.value}>{item.value}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">No candidates</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Traditional Table View (hidden by default, shown when filtering) */}
          {filterType !== 'all' && (
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
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TestDataManagement;