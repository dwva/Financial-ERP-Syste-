import { useState, useEffect, useMemo, useRef } from 'react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'react-toastify';
import { PlusCircle, Upload, X, FileText, Image as ImageIcon, Calendar, Save, Search } from 'lucide-react';

interface EditExpenseFormProps {
  expense: any;
  onCancel: () => void;
  onSave: () => void;
}

const EditExpenseForm = ({ expense, onCancel, onSave }: EditExpenseFormProps) => {
  const { updateExpense, dropdownData, serviceCharges } = useData();
  const [amount, setAmount] = useState(expense.amount.toString());
  const [description, setDescription] = useState(expense.description);
  const [date, setDate] = useState(expense.date);
  const [company, setCompany] = useState(expense.company);
  const [clientName, setClientName] = useState(expense.clientName || '');
  const [candidateName, setCandidateName] = useState(expense.candidateName || '');
  const [sector, setSector] = useState(expense.sector);
  const [serviceName, setServiceName] = useState(expense.serviceName || '');
  const [overdue, setOverdue] = useState(expense.overdue || false);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(expense.file);
  const [fileName, setFileName] = useState<string | null>(expense.fileName);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Autocomplete states for client name
  const [clientSearch, setClientSearch] = useState(expense.clientName || '');
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const clientInputRef = useRef<HTMLDivElement>(null);
  const clientSuggestionsRef = useRef<HTMLDivElement>(null);
  const sectorServiceRef = useRef<HTMLDivElement>(null);

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

  // Filter service charges based on search term and sort alphabetically
  const filteredServiceCharges = useMemo(() => {
    if (!searchTerm) return [...serviceCharges].sort((a, b) => a.name.localeCompare(b.name));
    return serviceCharges
      .filter(service => 
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (service.sector && service.sector.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [serviceCharges, searchTerm]);

  // Filter client suggestions based on search term (alphabetically sorted)
  const clientSuggestions = useMemo(() => {
    if (!clientSearch) return [];
    return clientOptions
      .filter(option => 
        option.toLowerCase().includes(clientSearch.toLowerCase())
      )
      .sort() // Sort alphabetically
      .slice(0, 10); // Limit to 10 suggestions
  }, [clientOptions, clientSearch]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close client suggestions
      if (
        clientInputRef.current && 
        !clientInputRef.current.contains(event.target as Node) &&
        clientSuggestionsRef.current && 
        !clientSuggestionsRef.current.contains(event.target as Node)
      ) {
        setShowClientSuggestions(false);
      }
      
      // Close service suggestions
      if (
        sectorServiceRef.current && 
        !sectorServiceRef.current.contains(event.target as Node)
      ) {
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      
      // Create preview for images
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFilePreview(null);
    setFileName(null);
  };

  const handleClientSelect = (client: string) => {
    setClientName(client);
    setClientSearch(client);
    setShowClientSuggestions(false);
  };

  const handleServiceSelect = (service: any) => {
    setServiceName(service.name);
    setSector(service.sector || '');
    setSearchTerm('');
    toast.success('Service selected successfully!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Add service name validation
    if (!serviceName) {
      toast.error('Please enter service name');
      return;
    }
    
    setLoading(true);
    
    try {
      // Convert file to base64 if it exists
      let fileBase64 = expense.file; // Keep existing file if no new file
      if (file) {
        fileBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      // Create expense object with updated properties
      const expenseData: any = {
        amount: parseFloat(amount),
        description,
        date,
        company,
        clientName,
        candidateName,
        sector,
        serviceName,
        overdue,
        file: fileBase64,
        fileName: fileName
      };

      console.log('Updating expense data:', expenseData);
      
      await updateExpense(expense.id, expenseData);

      toast.success('Expense updated successfully!');
      
      // Notify parent component
      onSave();
    } catch (error: any) {
      console.error('Error updating expense:', error);
      toast.error(`Failed to update expense: ${error.message || 'Please try again'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Save className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>Edit Expense</CardTitle>
            <CardDescription>Modify your expense details</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <div className="relative">
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="h-11"
                />
                <Calendar className="absolute right-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
          
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Select value={company} onValueChange={setCompany}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companyOptions.map((option, index) => (
                    <SelectItem key={index} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="company"
                type="text"
                placeholder="Enter company name"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
                className="h-11 mt-2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name *</Label>
              <div className="relative" ref={clientInputRef}>
                <Input
                  id="clientName"
                  type="text"
                  placeholder="Type to search clients..."
                  value={clientSearch}
                  onChange={(e) => {
                    setClientSearch(e.target.value);
                    // Also update clientName to keep them in sync
                    setClientName(e.target.value);
                    setShowClientSuggestions(true);
                  }}
                  onFocus={() => setShowClientSuggestions(true)}
                  required
                  className="h-11"
                />
                {showClientSuggestions && clientSuggestions.length > 0 && (
                  <div 
                    ref={clientSuggestionsRef}
                    className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
                  >
                    {clientSuggestions.map((client, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onClick={() => handleClientSelect(client)}
                      >
                        {client}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="candidateName">Candidate Name</Label>
              <Select value={candidateName} onValueChange={setCandidateName}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select candidate" />
                </SelectTrigger>
                <SelectContent>
                  {candidateOptions.map((option, index) => (
                    <SelectItem key={index} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="candidateName"
                type="text"
                placeholder="Enter candidate name"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="h-11 mt-2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sectorService">Sector/Service *</Label>
              <div className="relative" ref={sectorServiceRef}>
                <div className="flex items-center">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="sectorService"
                    placeholder="Search and select service"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
                
                {searchTerm && (
                  <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredServiceCharges.length > 0 ? (
                      filteredServiceCharges.map((service) => (
                        <div
                          key={service.id}
                          className="px-4 py-2 hover:bg-muted cursor-pointer flex justify-between items-center"
                          onClick={() => handleServiceSelect(service)}
                        >
                          <div>
                            <span>{service.name}</span>
                            {service.sector && (
                              <span className="text-xs text-muted-foreground ml-2">({service.sector})</span>
                            )}
                          </div>
                          <span className="text-muted-foreground">₹{service.amount.toFixed(2)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-muted-foreground">No services found</div>
                    )}
                  </div>
                )}
                
                {/* Display selected sector and service */}
                {(sector || serviceName) && (
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Selected Sector</Label>
                        <div className="font-medium">{sector || 'None'}</div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Selected Service</Label>
                        <div className="font-medium">{serviceName || 'None'}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter expense details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">User Status</Label>
              <Select value={expense.userId ? expense.userId.split('@')[0] : ''} disabled>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="User status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="founder">Founder</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="intern">Intern</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">Status is managed in user profile settings</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="overdue"
                checked={overdue}
                onCheckedChange={(checked) => setOverdue(checked as boolean)}
              />
              <Label htmlFor="overdue">Mark as Overdue</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Check this box if this expense is overdue (payment not received)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Receipt/Document</Label>
            <div className="relative">
              <Input
                id="file"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="h-11"
              />
              <Upload className="absolute right-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {filePreview && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-start gap-3">
                {filePreview && filePreview.startsWith('data:image') ? (
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-lg border"
                  />
                ) : (
                  <div className="w-20 h-20 flex items-center justify-center bg-background rounded-lg border">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{fileName || 'No file'}</p>
                  {file && <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading} className="flex-1 h-11">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 h-11 text-base font-medium" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EditExpenseForm;