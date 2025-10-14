import { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-toastify';
import { Plus, Edit, Save, X, Upload, Search, Check, FileSpreadsheet, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import * as XLSX from 'xlsx';

interface ServiceCharge {
  id: string;
  name: string;
  amount: number;
  sector?: string; // Make sector optional
}

interface ExcelSectorData {
  sectorName: string;
  services: { name: string; amount: number }[];
}

const ServiceCharges = () => {
  const { serviceCharges, addServiceCharge, updateServiceCharge, deleteServiceCharge } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkImportDialogOpen, setIsBulkImportDialogOpen] = useState(false);
  const [isExcelImportDialogOpen, setIsExcelImportDialogOpen] = useState(false);
  const [editingCharge, setEditingCharge] = useState<ServiceCharge | null>(null);
  const [editingExcelData, setEditingExcelData] = useState<{ sectorIndex: number; serviceIndex: number; field: 'name' | 'amount'; value: string } | null>(null);
  const [newCharge, setNewCharge] = useState({ name: '', amount: '', sector: '' }); // Add sector field
  const [bulkImportData, setBulkImportData] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCharges, setSelectedCharges] = useState<Record<string, boolean>>({});
  const [selectAll, setSelectAll] = useState(false);
  const [excelSectorData, setExcelSectorData] = useState<ExcelSectorData[]>([]);
  const [expandedSectors, setExpandedSectors] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Group service charges by sector
  const groupedServiceCharges = useMemo(() => {
    const groups: Record<string, ServiceCharge[]> = {};
    
    // Filter service charges based on search term
    const filtered = searchTerm 
      ? serviceCharges.filter(service => 
          service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (service.sector && service.sector.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      : serviceCharges;
    
    // Group by sector
    filtered.forEach(charge => {
      const sector = charge.sector || 'Uncategorized';
      if (!groups[sector]) {
        groups[sector] = [];
      }
      groups[sector].push(charge);
    });
    
    return groups;
  }, [serviceCharges, searchTerm]);

  // Handle select all functionality
  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    const newSelectedCharges: Record<string, boolean> = {};
    if (newSelectAll) {
      serviceCharges.forEach(charge => {
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
        amount: parseFloat(newCharge.amount),
        sector: newCharge.sector || undefined
      };
      addServiceCharge(charge);
      setNewCharge({ name: '', amount: '', sector: '' });
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
          toast.error(`Invalid format on line ${i + 1}. Expected "Service Name, Amount" or "Sector, Service Name, Amount"`);
          return;
        }

        let sector = '';
        let name = '';
        let amount = 0;

        // If we have 3 parts, first is sector
        if (parts.length >= 3) {
          sector = parts[0].trim();
          name = parts[1].trim();
          amount = parseFloat(parts[2].trim());
        } else {
          name = parts[0].trim();
          amount = parseFloat(parts[1].trim());
        }

        if (isNaN(amount)) {
          toast.error(`Invalid amount on line ${i + 1}: ${parts[parts.length - 1]}`);
          return;
        }

        newCharges.push({
          name,
          amount,
          sector: sector || undefined
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

  // Handle Excel file import with enhanced structure recognition
  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit. Please choose a smaller file.');
      return;
    }

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
        return;
      }
      
      // Process data based on structure - create sector data
      const sectorData: ExcelSectorData[] = [];
      
      // For your structure: 10 columns, each containing service/amount data
      const maxColumns = Math.min(headers.length, 10);
      for (let colIndex = 0; colIndex < maxColumns; colIndex++) {
        const sectorName = headers[colIndex];
        const services: { name: string; amount: number }[] = [];
        
        // Process each row in this column
        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
          const row = rows[rowIndex];
          
          // Check if this row has data for this column
          if (row.length > colIndex) {
            const cellValue = row[colIndex];
            if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
              // Parse the cell value as service,amount pair
              const stringValue = String(cellValue).trim();
              
              // If it contains a comma, split as service,amount
              if (stringValue.includes(',')) {
                const parts = stringValue.split(',');
                if (parts.length >= 2) {
                  const serviceName = parts[0].trim();
                  const amountValue = parts[1].trim();
                  const amount = parseFloat(amountValue) || 0;
                  
                  if (serviceName) {
                    services.push({ name: serviceName, amount });
                  }
                }
              } 
              // If it's a number, treat as amount (but we need a service name)
              else if (!isNaN(parseFloat(stringValue))) {
                // This is just an amount, we need to pair it with a service
                // For now, we'll skip standalone amounts
              }
              // Otherwise treat as service name with 0 amount
              else {
                services.push({ name: stringValue, amount: 0 });
              }
            }
          }
        }
        
        sectorData.push({ sectorName, services });
      }
      
      setExcelSectorData(sectorData);
      
      // Also import as regular service charges (flatten all sectors)
      let newCharges: Omit<ServiceCharge, 'id'>[] = [];
      
      // Collect all services from all sectors
      sectorData.forEach(sector => {
        sector.services.forEach(service => {
          newCharges.push({ name: service.name, amount: service.amount, sector: sector.sectorName });
        });
      });
      
      if (newCharges.length === 0) {
        toast.error('No valid service charges found in the Excel file');
        return;
      }

      // Add all charges
      newCharges.forEach(charge => {
        addServiceCharge(charge);
      });

      toast.success(`Successfully imported ${newCharges.length} service charges from Excel!`);
      setIsExcelImportDialogOpen(false);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error reading Excel file:', error);
      toast.error('Failed to read Excel file. Please make sure it is a valid Excel file.');
    }
  };

  // Toggle sector expansion
  const toggleSector = (sectorName: string) => {
    setExpandedSectors(prev => ({
      ...prev,
      [sectorName]: !prev[sectorName]
    }));
  };

  // Handle editing of Excel sector data
  const handleEditExcelData = (sectorIndex: number, serviceIndex: number, field: 'name' | 'amount', value: string) => {
    setEditingExcelData({ sectorIndex, serviceIndex, field, value });
  };

  // Save edited Excel sector data
  const saveEditedExcelData = () => {
    if (!editingExcelData) return;
    
    const { sectorIndex, serviceIndex, field, value } = editingExcelData;
    
    // Create a copy of the sector data
    const updatedSectorData = [...excelSectorData];
    
    // Update the specific field
    if (field === 'name') {
      updatedSectorData[sectorIndex].services[serviceIndex].name = value;
    } else {
      updatedSectorData[sectorIndex].services[serviceIndex].amount = parseFloat(value) || 0;
    }
    
    // Update state
    setExcelSectorData(updatedSectorData);
    setEditingExcelData(null);
    
    toast.success('Excel data updated successfully!');
  };

  // Delete a service from Excel sector data
  const handleDeleteExcelService = (sectorIndex: number, serviceIndex: number) => {
    // Create a copy of the sector data
    const updatedSectorData = [...excelSectorData];
    
    // Remove the service
    updatedSectorData[sectorIndex].services.splice(serviceIndex, 1);
    
    // Update state
    setExcelSectorData(updatedSectorData);
    
    toast.success('Service deleted successfully!');
  };

  // Clear all Excel sector data
  const handleClearExcelData = () => {
    setExcelSectorData([]);
    setExpandedSectors({});
    toast.success('Excel data cleared successfully!');
  };

  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Format amount in Singapore dollars
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
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
            
            {/* Excel Import Dialog */}
            <Dialog open={isExcelImportDialogOpen} onOpenChange={setIsExcelImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Import Excel
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Import Service Charges from Excel</DialogTitle>
                  <DialogDescription>
                    Upload an Excel file containing service charges data
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-2">
                      Excel file can have:
                      <br />
                      • Two columns: Service Name and Amount
                      <br />
                      • Multiple columns: Headers as service names
                    </p>
                    <Button onClick={triggerFileInput} variant="outline">
                      Select Excel File
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleExcelImport}
                      className="hidden"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium">Format Requirements:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-1">
                      <li>First row: Headers (service names)</li>
                      <li>Subsequent rows: Service data</li>
                      <li>For 2-column format: Column 1 = Service Name, Column 2 = Amount</li>
                      <li>Example: Visa, 150000</li>
                    </ul>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsExcelImportDialogOpen(false)}>
                    Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
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
                    Paste your service charge data in the format: "Sector, Service Name, Amount" or "Service Name, Amount" (one per line)
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bulkData">Service Charge Data</Label>
                    <Textarea
                      id="bulkData"
                      placeholder="Enter service charges in the format: Sector, Service Name, Amount&#10;Or: Service Name, Amount&#10;Example:&#10;Immigration, Visa Processing, 1500&#10;Immigration, Passport, 800&#10;Travel, Air Ticket, 1300&#10;Accommodation, Hotel Booking, 500&#10;Transportation, Airport Transfer, 250"
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
                      <li>Format 1: "Sector, Service Name, Amount" (three values) - Recommended</li>
                      <li>Format 2: "Service Name, Amount" (two values, no sector)</li>
                      <li>Separate values with commas</li>
                      <li>Amount should be a number (no currency symbols)</li>
                      <li>Example with sectors: "Immigration, Visa Processing, 1500"</li>
                      <li>Example without sectors: "Visa Processing, 1500"</li>
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
                    <Label htmlFor="sectorName">Sector (Optional)</Label>
                    <Input
                      id="sectorName"
                      placeholder="Enter sector name"
                      value={newCharge.sector}
                      onChange={(e) => setNewCharge({...newCharge, sector: e.target.value})}
                    />
                  </div>
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
                    <Label htmlFor="serviceAmount">Amount (S$)</Label>
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
        
        {/* Excel Sector Data Section */}
        {excelSectorData.length > 0 && (
          <div className="mb-6 border rounded-lg overflow-hidden">
            <div className="bg-muted p-3 font-medium flex items-center justify-between">
              <div className="flex items-center">
                <FileSpreadsheet className="w-5 h-5 mr-2" />
                Excel Sector Data
              </div>
              <Button variant="outline" size="sm" onClick={handleClearExcelData}>
                <Trash2 className="w-4 h-4 mr-1" />
                Clear Data
              </Button>
            </div>
            <div className="max-h-96 overflow-auto">
              {excelSectorData.map((sector, sectorIndex) => (
                <div key={sectorIndex} className="border-b last:border-b-0">
                  <div 
                    className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleSector(sector.sectorName)}
                  >
                    <div className="font-medium">
                      {sector.sectorName} ({sector.services.length} services)
                    </div>
                    <Button variant="ghost" size="sm">
                      {expandedSectors[sector.sectorName] ? 
                        <ChevronDown className="w-4 h-4" /> : 
                        <ChevronRight className="w-4 h-4" />
                      }
                    </Button>
                  </div>
                  {expandedSectors[sector.sectorName] && (
                    <div className="p-3">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Service Name</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sector.services.map((service, serviceIndex) => (
                            <TableRow key={serviceIndex}>
                              <TableCell>
                                {editingExcelData?.sectorIndex === sectorIndex && 
                                 editingExcelData.serviceIndex === serviceIndex && 
                                 editingExcelData.field === 'name' ? (
                                  <Input
                                    value={editingExcelData.value}
                                    onChange={(e) => handleEditExcelData(sectorIndex, serviceIndex, 'name', e.target.value)}
                                    onBlur={saveEditedExcelData}
                                    onKeyDown={(e) => e.key === 'Enter' && saveEditedExcelData()}
                                    autoFocus
                                  />
                                ) : (
                                  <div 
                                    onClick={() => handleEditExcelData(sectorIndex, serviceIndex, 'name', service.name)}
                                    className="cursor-pointer hover:underline"
                                  >
                                    {service.name}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                {editingExcelData?.sectorIndex === sectorIndex && 
                                 editingExcelData.serviceIndex === serviceIndex && 
                                 editingExcelData.field === 'amount' ? (
                                  <Input
                                    type="number"
                                    value={editingExcelData.value}
                                    onChange={(e) => handleEditExcelData(sectorIndex, serviceIndex, 'amount', e.target.value)}
                                    onBlur={saveEditedExcelData}
                                    onKeyDown={(e) => e.key === 'Enter' && saveEditedExcelData()}
                                    autoFocus
                                  />
                                ) : (
                                  <div 
                                    onClick={() => handleEditExcelData(sectorIndex, serviceIndex, 'amount', service.amount.toString())}
                                    className="cursor-pointer hover:underline"
                                  >
                                    {formatAmount(service.amount)}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteExcelService(sectorIndex, serviceIndex)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Grouped Service Charges by Sector */}
        <div className="border rounded-lg overflow-hidden">
          {Object.keys(groupedServiceCharges).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No service charges found. Add some service charges to get started.
            </div>
          ) : (
            Object.entries(groupedServiceCharges).map(([sector, charges]) => (
              <div key={sector} className="border-b last:border-b-0">
                {/* Sector Header */}
                <div 
                  className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleSector(sector)}
                >
                  <div className="font-medium">
                    {sector} ({charges.length} services)
                  </div>
                  <Button variant="ghost" size="sm">
                    {expandedSectors[sector] ? 
                      <ChevronDown className="w-4 h-4" /> : 
                      <ChevronRight className="w-4 h-4" />
                    }
                  </Button>
                </div>
                
                {/* Sector Services */}
                {expandedSectors[sector] && (
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
                      {charges.map((charge) => (
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
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceCharges;