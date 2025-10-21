import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-toastify';
import { Upload, FileSpreadsheet, Search, CheckCircle, PlusCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useData } from '@/contexts/DataContext';

interface ExcelData {
  headers: string[];
  rows: any[];
}

interface SectorData {
  [key: string]: any[];
}

interface ServiceData {
  [key: string]: any[];
}

const ExcelImportSection = () => {
  const { addServiceCharge } = useData(); // Add this to use the service charge context
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [sectorData, setSectorData] = useState<SectorData>({});
  const [serviceData, setServiceData] = useState<ServiceData>({});
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedHeader, setSelectedHeader] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fileInfo, setFileInfo] = useState<{name: string, size: string} | null>(null);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle Excel file import - Enhanced to correctly match the format: Sector Name, Service Name, Amount
  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit. Please choose a smaller file.');
      return;
    }

    setIsLoading(true);
    setFileInfo({
      name: file.name,
      size: formatFileSize(file.size)
    });
    
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
      
      setExcelData({ headers, rows });
      
      // Process data by sectors - CORRECTED to match the expected format
      const sectorMap: SectorData = {};
      rows.forEach((row, index) => {
        // Expecting format: [Sector Name, Service Name, Amount]
        if (row && row.length >= 3) {
          const sectorValue = row[0]; // First column: Sector Name
          const sector = (sectorValue !== null && sectorValue !== undefined && sectorValue !== '') 
            ? String(sectorValue).trim() 
            : `Uncategorized`;
            
          if (!sectorMap[sector]) {
            sectorMap[sector] = [];
          }
          sectorMap[sector].push(row);
        }
      });
      
      setSectorData(sectorMap);
      
      // Process data by services (column headers) with service/amount pairs
      const serviceMap: ServiceData = {};
      headers.forEach((header, headerIndex) => {
        const services: any[] = [];
        
        // Process each row for this column
        rows.forEach((row, rowIndex) => {
          if (row.length > headerIndex) {
            const cellValue = row[headerIndex];
            if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
              // For the service column (index 1), extract service name and amount
              if (headerIndex === 1 && row.length >= 3) {
                // Service name is in column 1, amount is in column 2
                const serviceName = String(cellValue).trim();
                const amountValue = row[2]; // Amount from column 2
                const amount = parseFloat(String(amountValue)) || 0;
                
                services.push({ name: serviceName, amount, row: rowIndex + 1 });
              } else {
                // For other columns, just store the value
                services.push({ name: String(cellValue).trim(), amount: 0, row: rowIndex + 1 });
              }
            }
          }
        });
        
        serviceMap[header] = services;
      });
      
      setServiceData(serviceMap);
      toast.success(`Excel file imported successfully! ${headers.length} columns and ${rows.length} rows loaded.`);
      
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

  // Get filtered options based on search term
  const getFilteredOptions = () => {
    if (!selectedHeader || !excelData) return [];
    
    const headerIndex = excelData.headers.indexOf(selectedHeader);
    if (headerIndex === -1) return [];
    
    const options = excelData.rows
      .map(row => row[headerIndex])
      .filter((value, index, self) => {
        // Filter out undefined/null/empty values and duplicates
        if (value === undefined || value === null || value === '') return false;
        const stringValue = String(value);
        return stringValue.toLowerCase().includes(searchTerm.toLowerCase()) &&
          self.findIndex(v => String(v) === stringValue) === index;
      })
      .slice(0, 200); // Limit to 200 options for better performance
    
    return options;
  };

  // Reset all data
  const resetData = () => {
    setExcelData(null);
    setSectorData({});
    setServiceData({});
    setSelectedSector('');
    setSelectedService('');
    setSelectedHeader('');
    setSearchTerm('');
    setFileInfo(null);
  };

  // Import sector data into service charges - CORRECTED to match the expected format
  const importSectorData = async () => {
    if (!sectorData || Object.keys(sectorData).length === 0) {
      toast.error('No sector data available for import');
      return;
    }

    try {
      let importedCount = 0;
      const duplicateServices: string[] = [];
      
      // Process each sector - matching the correct format
      for (const [sectorName, rows] of Object.entries(sectorData)) {
        // Process each row in the sector
        for (const row of rows) {
          // Check if row has at least 3 columns (sector, service, amount)
          if (row.length >= 3) {
            const serviceValue = row[1]; // Second column: service name
            const amountValue = row[2]; // Third column: amount
            
            // Validate service name
            if (serviceValue !== null && serviceValue !== undefined && serviceValue !== '') {
              const serviceName = String(serviceValue).trim();
              const amount = parseFloat(String(amountValue)) || 0;
              
              if (serviceName) {
                // Add service charge with sector information
                const serviceCharge = {
                  name: serviceName,
                  amount: amount,
                  sector: sectorName // This ensures services are grouped by sector
                };
                
                try {
                  await addServiceCharge(serviceCharge);
                  importedCount++;
                } catch (error: any) {
                  // Check if it's a duplicate error
                  if (error.message && error.message.includes('duplicate')) {
                    duplicateServices.push(`${sectorName} - ${serviceName}`);
                  } else {
                    throw error; // Re-throw if it's not a duplicate error
                  }
                }
              }
            }
          }
        }
      }
      
      let message = `Successfully imported ${importedCount} service charges with sector information!`;
      
      if (duplicateServices.length > 0) {
        message += ` Skipped ${duplicateServices.length} duplicate services.`;
      }
      
      if (importedCount > 0 || duplicateServices.length > 0) {
        toast.success(message);
        
        if (duplicateServices.length > 0) {
          console.log('Duplicate services skipped:', duplicateServices);
        }
      } else {
        toast.info('No valid service charges found in the sector data. Please check that your Excel file has at least 3 columns: Sector Name, Service Name, Amount');
      }
    } catch (error) {
      console.error('Error importing sector data:', error);
      toast.error('Failed to import sector data. Please make sure your Excel file follows the format: Sector Name, Service Name, Amount');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Excel Import Section</CardTitle>
        <CardDescription>
          Import Excel data in the format: Sector Name, Service Name, Amount (one service per row)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Excel Import */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-2">
              Upload an Excel file with your data
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button 
                onClick={triggerFileInput} 
                variant="outline" 
                disabled={isLoading}
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
              {excelData && (
                <Button 
                  onClick={resetData} 
                  variant="outline"
                >
                  Reset Data
                </Button>
              )}
              {/* Add Import Sector Data Button */}
              {Object.keys(sectorData).length > 0 && (
                <Button 
                  onClick={importSectorData}
                  variant="default"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Import All Services
                </Button>
              )}
            </div>
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
            
            {/* Format instructions */}
            <div className="mt-3 p-3 bg-blue-50 rounded-md text-left">
              <p className="text-sm font-medium text-blue-800">Expected Format:</p>
              <p className="text-xs text-blue-700 mt-1">
                Each row should contain exactly 3 columns:<br/>
                <strong>Sector Name, Service Name, Amount</strong><br/><br/>
                Example:<br/>
                Tourism, Camping, 8000<br/>
                Tourism, Photography, 3000<br/>
                Tourism, Travel Insurance, 7000
              </p>
            </div>
            
            {/* File info display */}
            {fileInfo && (
              <div className="mt-3 p-2 bg-green-50 rounded-md flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-sm text-green-800">
                  {fileInfo.name} ({fileInfo.size})
                </span>
              </div>
            )}
          </div>

          {/* File information and statistics - ENHANCED */}
          {excelData && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">File Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-white p-2 rounded text-center">
                  <div className="font-bold text-lg">{excelData.headers.length}</div>
                  <div className="text-muted-foreground">Columns</div>
                </div>
                <div className="bg-white p-2 rounded text-center">
                  <div className="font-bold text-lg">{excelData.rows.length}</div>
                  <div className="text-muted-foreground">Rows</div>
                </div>
                <div className="bg-white p-2 rounded text-center">
                  <div className="font-bold text-lg">{Object.keys(sectorData).length}</div>
                  <div className="text-muted-foreground">Sectors</div>
                </div>
                <div className="bg-white p-2 rounded text-center">
                  <div className="font-bold text-lg">
                    {Object.values(sectorData).reduce((total, sector) => total + sector.length, 0)}
                  </div>
                  <div className="text-muted-foreground">Total Services</div>
                </div>
              </div>
              <div className="mt-3 p-3 bg-green-50 rounded-md">
                <p className="text-sm text-green-800">
                  <strong>Format Detected:</strong> Sector Name, Service Name, Amount
                </p>
              </div>
            </div>
          )}

          {/* Sector Selection - ENHANCED to show correct sector data */}
          {Object.keys(sectorData).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sector">Select Sector</Label>
                <Select value={selectedSector} onValueChange={setSelectedSector}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(sectorData).map(sector => (
                      <SelectItem key={sector} value={sector}>
                        {sector} ({sectorData[sector].length} services)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="header">Data Format</Label>
                <div className="p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800">
                    Expected Format: <strong>Sector Name, Service Name, Amount</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Service Selection - NEW FEATURE */}
          {Object.keys(serviceData).length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="service">Select Service (Column Header)</Label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(serviceData).map(service => (
                    <SelectItem key={service} value={service}>
                      {service} ({serviceData[service].length} items)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Service Data Preview - NEW FEATURE */}
          {selectedService && serviceData[selectedService] && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted p-2 font-medium flex justify-between items-center">
                <span>Data for Service: {selectedService}</span>
                <span className="text-sm font-normal">
                  {serviceData[selectedService].length} items
                </span>
              </div>
              <div className="max-h-60 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted">
                      <th className="p-2 text-left border-b">Row #</th>
                      <th className="p-2 text-left border-b">Service Name</th>
                      <th className="p-2 text-left border-b">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceData[selectedService].map((item: any, index) => (
                      <tr key={index} className="border-b hover:bg-muted">
                        <td className="p-2 border-r">Row {item.row || index + 1}</td>
                        <td className="p-2">
                          {item.name !== undefined && item.name !== null && item.name !== '' ? String(item.name) : '-'}
                        </td>
                        <td className="p-2">
                          {item.amount !== undefined && item.amount !== null ? 
                            new Intl.NumberFormat('en-IN', {
                              style: 'currency',
                              currency: 'INR',
                            }).format(item.amount) : 
                            '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sector Data Preview - NEW FEATURE */}
          {selectedSector && sectorData[selectedSector] && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted p-2 font-medium flex justify-between items-center">
                <span>Services in Sector: {selectedSector}</span>
                <span className="text-sm font-normal">
                  {sectorData[selectedSector].length} services
                </span>
              </div>
              <div className="max-h-60 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted">
                      <th className="p-2 text-left border-b">Service Name</th>
                      <th className="p-2 text-left border-b">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectorData[selectedSector].map((row: any, index) => (
                      <tr key={index} className="border-b hover:bg-muted">
                        <td className="p-2">
                          {row[1] !== undefined && row[1] !== null && row[1] !== '' ? String(row[1]) : '-'}
                        </td>
                        <td className="p-2">
                          {row[2] !== undefined && row[2] !== null && row[2] !== '' ? 
                            new Intl.NumberFormat('en-IN', {
                              style: 'currency',
                              currency: 'INR',
                            }).format(parseFloat(String(row[2])) || 0) : 
                            '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Dynamic Dropdown Based on Selection */}
          {selectedSector && selectedHeader && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search {selectedHeader}</Label>
                <div className="relative">
                  <div className="flex items-center">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder={`Search ${selectedHeader}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Showing {Math.min(getFilteredOptions().length, 200)} of {getFilteredOptions().length} results
                </p>
              </div>

              {/* Dropdown with filtered options */}
              {getFilteredOptions().length > 0 && (
                <div className="border rounded-md shadow-lg max-h-60 overflow-auto">
                  {getFilteredOptions().map((option, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                      onClick={() => {
                        setSearchTerm(String(option));
                        toast.info(`Selected: ${option}`);
                      }}
                    >
                      {String(option)}
                    </div>
                  ))}
                </div>
              )}

              {/* Input box with selected value */}
              <div className="space-y-2">
                <Label htmlFor="selectedValue">Selected Value</Label>
                <Input
                  id="selectedValue"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Selected value will appear here"
                />
              </div>
            </div>
          )}

          {/* Preview of imported data - ENHANCED to show the correct format */}
          {excelData && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted p-2 font-medium flex justify-between items-center">
                <span>Imported Data Preview (Sector, Service, Amount)</span>
                <span className="text-sm font-normal">
                  {excelData.rows.length} rows × {excelData.headers.length} columns
                </span>
              </div>
              <div className="max-h-60 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted">
                      <th className="p-2 text-left border-b">Sector Name</th>
                      <th className="p-2 text-left border-b">Service Name</th>
                      <th className="p-2 text-left border-b">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {excelData.rows.slice(0, 15).map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b hover:bg-muted">
                        <td className="p-2 border-r max-w-xs truncate">
                          {row[0] !== undefined && row[0] !== null && row[0] !== '' ? String(row[0]) : '-'}
                        </td>
                        <td className="p-2 border-r max-w-xs truncate">
                          {row[1] !== undefined && row[1] !== null && row[1] !== '' ? String(row[1]) : '-'}
                        </td>
                        <td className="p-2 border-r max-w-xs truncate">
                          {row[2] !== undefined && row[2] !== null && row[2] !== '' ? 
                            new Intl.NumberFormat('en-IN', {
                              style: 'currency',
                              currency: 'INR',
                            }).format(parseFloat(String(row[2])) || 0) : 
                            '-'}
                        </td>
                      </tr>
                    ))}
                    {excelData.rows.length > 15 && (
                      <tr>
                        <td colSpan={3} className="p-2 text-center text-muted-foreground">
                          ... and {excelData.rows.length - 15} more rows
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExcelImportSection;