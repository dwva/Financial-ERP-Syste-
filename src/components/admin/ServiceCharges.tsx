import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-toastify';
import { Plus, Edit, Save, X, Upload, Search, Check } from 'lucide-react';
import { useData } from '@/contexts/DataContext';

interface ServiceCharge {
  id: string;
  name: string;
  amount: number;
}

const ServiceCharges = () => {
  const { serviceCharges, addServiceCharge, updateServiceCharge, deleteServiceCharge } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkImportDialogOpen, setIsBulkImportDialogOpen] = useState(false);
  const [editingCharge, setEditingCharge] = useState<ServiceCharge | null>(null);
  const [newCharge, setNewCharge] = useState({ name: '', amount: '' });
  const [bulkImportData, setBulkImportData] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCharges, setSelectedCharges] = useState<Record<string, boolean>>({});
  const [selectAll, setSelectAll] = useState(false);

  // Filter service charges based on search term
  const filteredServiceCharges = useMemo(() => {
    if (!searchTerm) return serviceCharges;
    return serviceCharges.filter(service => 
      service.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [serviceCharges, searchTerm]);

  // Handle select all functionality
  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    const newSelectedCharges: Record<string, boolean> = {};
    if (newSelectAll) {
      filteredServiceCharges.forEach(charge => {
        newSelectedCharges[charge.id] = true;
      });
    }
    setSelectedCharges(newSelectedCharges);
  };

  // Handle individual charge selection
  const handleSelectCharge = (id: string) => {
    setSelectedCharges(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Check if a charge is selected
  const isChargeSelected = (id: string) => {
    return !!selectedCharges[id];
  };

  // Delete selected charges
  const handleDeleteSelected = () => {
    const selectedIds = Object.keys(selectedCharges).filter(id => selectedCharges[id]);
    if (selectedIds.length === 0) {
      toast.error('Please select at least one service charge to delete');
      return;
    }
    
    selectedIds.forEach(id => {
      deleteServiceCharge(id);
    });
    
    // Clear selection
    setSelectedCharges({});
    setSelectAll(false);
    toast.success(`Successfully deleted ${selectedIds.length} service charge(s)!`);
  };

  const handleAddCharge = () => {
    if (newCharge.name && newCharge.amount) {
      const charge: Omit<ServiceCharge, 'id'> = {
        name: newCharge.name,
        amount: parseFloat(newCharge.amount)
      };
      addServiceCharge(charge);
      setNewCharge({ name: '', amount: '' });
      setIsDialogOpen(false);
      toast.success('Service charge added successfully!');
    }
  };

  const handleEditCharge = (charge: ServiceCharge) => {
    setEditingCharge(charge);
  };

  const handleSaveEdit = () => {
    if (editingCharge) {
      updateServiceCharge(editingCharge.id, editingCharge);
      setEditingCharge(null);
      toast.success('Service charge updated successfully!');
    }
  };

  const handleDeleteCharge = (id: string) => {
    deleteServiceCharge(id);
    toast.success('Service charge deleted successfully!');
  };

  const handleBulkImport = () => {
    if (!bulkImportData.trim()) {
      toast.error('Please enter service charge data');
      return;
    }

    try {
      const lines = bulkImportData.trim().split('\n');
      const newCharges: Omit<ServiceCharge, 'id'>[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Split by comma or tab
        const parts = line.includes(',') ? line.split(',') : line.split('\t');
        if (parts.length < 2) {
          toast.error(`Invalid format on line ${i + 1}. Expected "Service Name, Amount"`);
          return;
        }

        const name = parts[0].trim();
        const amount = parseFloat(parts[1].trim());

        if (isNaN(amount)) {
          toast.error(`Invalid amount on line ${i + 1}: ${parts[1]}`);
          return;
        }

        newCharges.push({
          name,
          amount
        });
      }

      // Add all charges
      newCharges.forEach(charge => {
        addServiceCharge(charge);
      });

      setBulkImportData('');
      setIsBulkImportDialogOpen(false);
      toast.success(`Successfully imported ${newCharges.length} service charges!`);
    } catch (error) {
      console.error('Error importing service charges:', error);
      toast.error('Failed to import service charges. Please check the format and try again.');
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Service Charges</CardTitle>
            <CardDescription>Manage predefined service charges</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDeleteSelected} disabled={!Object.values(selectedCharges).some(Boolean)}>
              <X className="w-4 h-4 mr-2" />
              Delete Selected
            </Button>
            <Dialog open={isBulkImportDialogOpen} onOpenChange={setIsBulkImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Import
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Bulk Import Service Charges</DialogTitle>
                  <DialogDescription>
                    Paste your service charge data in the format: "Service Name, Amount" (one per line)
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bulkData">Service Charge Data</Label>
                    <Textarea
                      id="bulkData"
                      placeholder="Enter service charges in the format: Service Name, Amount&#10;Example:&#10;Visa, 150000&#10;Ticket, 13000&#10;Hotel, 5000&#10;Transport, 2500"
                      value={bulkImportData}
                      onChange={(e) => setBulkImportData(e.target.value)}
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium">Format Instructions:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-1">
                      <li>Enter one service charge per line</li>
                      <li>Separate service name and amount with a comma or tab</li>
                      <li>Amount should be a number (no currency symbols)</li>
                      <li>Example: "Visa, 150000" or "Ticket 13000"</li>
                    </ul>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsBulkImportDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleBulkImport}>
                    Import Service Charges
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Service Charge
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Service Charge</DialogTitle>
                  <DialogDescription>
                    Add a new service with its predefined charge amount
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="serviceName">Service Name</Label>
                    <Input
                      id="serviceName"
                      placeholder="Enter service name"
                      value={newCharge.name}
                      onChange={(e) => setNewCharge({...newCharge, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serviceAmount">Amount (₹)</Label>
                    <Input
                      id="serviceAmount"
                      type="number"
                      placeholder="Enter amount"
                      value={newCharge.amount}
                      onChange={(e) => setNewCharge({...newCharge, amount: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddCharge}>
                    Add Service Charge
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search Bar */}
        <div className="mb-4 flex items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search service charges..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Button variant="ghost" size="sm" onClick={handleSelectAll} className="p-0 h-8 w-8">
                    {selectAll ? (
                      <Check className="w-4 h-4 text-blue-500" />
                    ) : (
                      <div className="w-4 h-4 border rounded"></div>
                    )}
                  </Button>
                </TableHead>
                <TableHead>Service Name</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServiceCharges.map((charge) => (
                <TableRow key={charge.id}>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSelectCharge(charge.id)}
                      className="p-0 h-8 w-8"
                    >
                      {isChargeSelected(charge.id) ? (
                        <Check className="w-4 h-4 text-blue-500" />
                      ) : (
                        <div className="w-4 h-4 border rounded"></div>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    {editingCharge?.id === charge.id ? (
                      <Input
                        value={editingCharge.name}
                        onChange={(e) => setEditingCharge({...editingCharge, name: e.target.value})}
                      />
                    ) : (
                      charge.name
                    )}
                  </TableCell>
                  <TableCell>
                    {editingCharge?.id === charge.id ? (
                      <Input
                        type="number"
                        value={editingCharge.amount}
                        onChange={(e) => setEditingCharge({...editingCharge, amount: parseFloat(e.target.value) || 0})}
                      />
                    ) : (
                      formatAmount(charge.amount)
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingCharge?.id === charge.id ? (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={handleSaveEdit}>
                          <Save className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingCharge(null)}>
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={() => handleEditCharge(charge)}>
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => handleDeleteCharge(charge.id)}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceCharges;