import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '@/contexts/DataContext';
import { PlusCircle, Trash2 } from 'lucide-react';

const TestDropdowns = () => {
  const { dropdownData, addDropdownData, deleteDropdownData } = useData();
  const [newItem, setNewItem] = useState({ type: '', value: '' });

  // Filter dropdown data by type
  const companyOptions = useMemo(() => 
    dropdownData.filter(item => item.type === 'company').map(item => item.value), 
    [dropdownData]
  );
  
  const clientOptions = useMemo(() => 
    dropdownData.filter(item => item.type === 'client').map(item => item.value), 
    [dropdownData]
  );
  
  const candidateOptions = useMemo(() => 
    dropdownData.filter(item => item.type === 'candidate').map(item => item.value), 
    [dropdownData]
  );
  
  const sectorOptions = useMemo(() => 
    dropdownData.filter(item => item.type === 'sector').map(item => item.value), 
    [dropdownData]
  );

  const handleAddItem = async () => {
    if (!newItem.type || !newItem.value) {
      alert('Please select a type and enter a value');
      return;
    }
    
    try {
      await addDropdownData({
        type: newItem.type as 'company' | 'client' | 'candidate' | 'sector',
        value: newItem.value
      });
      
      alert('Item added successfully!');
      setNewItem({ type: '', value: '' });
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item. Please try again.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Dropdowns</CardTitle>
        <CardDescription>Test the dropdown functionality</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Add New Item Form */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Add Test Item</h3>
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
            
            {/* Stats Overview */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Dropdown Data Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Companies</p>
                  <p className="text-2xl font-bold">{companyOptions.length}</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Clients</p>
                  <p className="text-2xl font-bold">{clientOptions.length}</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Candidates</p>
                  <p className="text-2xl font-bold">{candidateOptions.length}</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Sectors</p>
                  <p className="text-2xl font-bold">{sectorOptions.length}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Test Dropdowns */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Test Dropdowns</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Dropdown</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companyOptions.map((option, index) => (
                      <SelectItem key={index} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                    {companyOptions.length === 0 && (
                      <SelectItem value="">No companies available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Client Dropdown</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientOptions.map((option, index) => (
                      <SelectItem key={index} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                    {clientOptions.length === 0 && (
                      <SelectItem value="">No clients available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Candidate Dropdown</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select candidate" />
                  </SelectTrigger>
                  <SelectContent>
                    {candidateOptions.map((option, index) => (
                      <SelectItem key={index} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                    {candidateOptions.length === 0 && (
                      <SelectItem value="">No candidates available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Sector Dropdown</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectorOptions.map((option, index) => (
                      <SelectItem key={index} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                    {sectorOptions.length === 0 && (
                      <SelectItem value="">No sectors available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestDropdowns;