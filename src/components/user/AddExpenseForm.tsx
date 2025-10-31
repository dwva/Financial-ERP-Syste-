import { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import { PlusCircle, Upload, X, FileText, Image as ImageIcon, Calendar, Search } from 'lucide-react';

const AddExpenseForm = () => {
  const { user } = useAuth();
  const { addExpense, employees, dropdownData, serviceCharges } = useData();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [company, setCompany] = useState('');
  const [clientName, setClientName] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [sector, setSector] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [overdue, setOverdue] = useState(false);
  const [overdueDays, setOverdueDays] = useState(''); // Add this state for overdue days
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Add this state to prevent duplicate submissions

  // Autocomplete states
  const [clientSearch, setClientSearch] = useState('');
  const [candidateSearch, setCandidateSearch] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [showCandidateSuggestions, setShowCandidateSuggestions] = useState(false);
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
  const clientInputRef = useRef<HTMLDivElement>(null);
  const candidateInputRef = useRef<HTMLDivElement>(null);
  const companyInputRef = useRef<HTMLDivElement>(null);
  const clientSuggestionsRef = useRef<HTMLDivElement>(null);
  const candidateSuggestionsRef = useRef<HTMLDivElement>(null);
  const companySuggestionsRef = useRef<HTMLDivElement>(null);

  // Get current user data
  const currentUser = employees.find(emp => emp.email === user?.email);

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
  
  // Get unique sectors from service charges
  const sectorOptions = useMemo(() => {
    const sectors = serviceCharges
      .map(service => service.sector)
      .filter((sector, index, self) => sector && self.indexOf(sector) === index) as string[];
    return sectors.sort();
  }, [serviceCharges]);
  
  // Get service names filtered by selected sector
  const serviceOptions = useMemo(() => {
    if (!sector) return [];
    return serviceCharges
      .filter(service => service.sector === sector)
      .map(service => service.name)
      .sort();
  }, [serviceCharges, sector]);

  // Filter suggestions based on search term (alphabetically sorted)
  const clientSuggestions = useMemo(() => {
    if (!clientSearch) return [];
    return clientOptions
      .filter(option => 
        option.toLowerCase().includes(clientSearch.toLowerCase())
      )
      .sort() // Sort alphabetically
      .slice(0, 10); // Limit to 10 suggestions
  }, [clientOptions, clientSearch]);

  const candidateSuggestions = useMemo(() => {
    if (!candidateSearch) return [];
    return candidateOptions
      .filter(option => 
        option.toLowerCase().includes(candidateSearch.toLowerCase())
      )
      .sort() // Sort alphabetically
      .slice(0, 10); // Limit to 10 suggestions
  }, [candidateOptions, candidateSearch]);

  const companySuggestions = useMemo(() => {
    if (!companySearch) return [];
    return companyOptions
      .filter(option => 
        option.toLowerCase().includes(companySearch.toLowerCase())
      )
      .sort() // Sort alphabetically
      .slice(0, 10); // Limit to 10 suggestions
  }, [companyOptions, companySearch]);

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
      
      // Close candidate suggestions
      if (
        candidateInputRef.current && 
        !candidateInputRef.current.contains(event.target as Node) &&
        candidateSuggestionsRef.current && 
        !candidateSuggestionsRef.current.contains(event.target as Node)
      ) {
        setShowCandidateSuggestions(false);
      }
      
      // Close company suggestions
      if (
        companyInputRef.current && 
        !companyInputRef.current.contains(event.target as Node) &&
        companySuggestionsRef.current && 
        !companySuggestionsRef.current.contains(event.target as Node)
      ) {
        setShowCompanySuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debug: Log dropdown data and options
  useEffect(() => {
    console.log('Dropdown Data:', dropdownData);
    console.log('Service Charges:', serviceCharges);
    console.log('Sector Options:', sectorOptions);
    console.log('Service Options:', serviceOptions);
  }, [dropdownData, serviceCharges, sectorOptions, serviceOptions]);

  console.log('Current user from AuthContext:', user);
  console.log('Current user from DataContext:', currentUser);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
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
  };

  const handleClientSelect = (client: string) => {
    setClientName(client);
    setClientSearch(client);
    setShowClientSuggestions(false);
  };

  const handleCandidateSelect = (candidate: string) => {
    setCandidateName(candidate);
    setCandidateSearch(candidate);
    setShowCandidateSuggestions(false);
  };

  const handleCompanySelect = (company: string) => {
    setCompany(company);
    setCompanySearch(company);
    setShowCompanySuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmitting) {
      console.log('Submission already in progress, ignoring duplicate submit');
      return;
    }
    
    if (!user) {
      toast.error('User not authenticated');
      return;
    }
    
    if (!amount || !date || !company || !clientName || !candidateName || !sector || !description || !serviceName) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Set submitting state
    setIsSubmitting(true);
    setLoading(true);
    
    try {
      // Calculate if expense is overdue based on overdue days
      let isOverdue = overdue;
      if (overdueDays && !isNaN(parseInt(overdueDays))) {
        const dueDate = new Date(date);
        dueDate.setDate(dueDate.getDate() + parseInt(overdueDays));
        isOverdue = dueDate < new Date();
      }
      
      // Create expense object with correct properties
      const expenseData = {
        userId: user.email || '',
        amount: parseFloat(amount),
        description,
        date,
        company,
        clientName,
        candidateName,
        sector,
        serviceName,
        overdue: isOverdue,
        overdueDays: overdueDays, // Add this line to save overdueDays
        fileName: file?.name || null,
      };

      console.log('Submitting expense data:', expenseData);
      
      // Pass the file separately to addExpense to handle proper file upload
      await addExpense(expenseData, file);

      toast.success('Expense added successfully!');
      setAmount('');
      setDescription('');
      setDate('');
      setCompany('');
      setClientName('');
      setClientSearch('');
      setCandidateName('');
      setCandidateSearch('');
      setCompanySearch('');
      setSector('');
      setServiceName('');
      setOverdue(false);
      setOverdueDays(''); // Reset overdue days
      setFile(null);
      setFilePreview(null);
    } catch (error: any) {
      console.error('Error adding expense:', error);
      toast.error(`Failed to add expense: ${error.message || 'Please try again'}`);
    } finally {
      // Reset submitting state
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <PlusCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>Add New Expense</CardTitle>
            <CardDescription>Submit your expense with details and receipt</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="h-10"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="date">Date</Label>
              <div className="relative">
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="h-10"
                />
                <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
          
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="company">Company</Label>
              <div className="relative" ref={companyInputRef}>
                <Input
                  id="company"
                  type="text"
                  placeholder="Type to search companies..."
                  value={companySearch}
                  onChange={(e) => {
                    setCompanySearch(e.target.value);
                    setCompany(e.target.value);
                    setShowCompanySuggestions(true);
                  }}
                  onFocus={() => setShowCompanySuggestions(true)}
                  required
                  className="h-10"
                />
                {showCompanySuggestions && companySuggestions.length > 0 && (
                  <div 
                    ref={companySuggestionsRef}
                    className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-auto"
                  >
                    {companySuggestions.map((company, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onClick={() => handleCompanySelect(company)}
                      >
                        {company}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {companyOptions.length} companies available
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="clientName">Client Name</Label>
              <div className="relative" ref={clientInputRef}>
                <Input
                  id="clientName"
                  type="text"
                  placeholder="Type to search clients..."
                  value={clientSearch}
                  onChange={(e) => {
                    setClientSearch(e.target.value);
                    setClientName(e.target.value);
                    setShowClientSuggestions(true);
                  }}
                  onFocus={() => setShowClientSuggestions(true)}
                  required
                  className="h-10"
                />
                {showClientSuggestions && clientSuggestions.length > 0 && (
                  <div 
                    ref={clientSuggestionsRef}
                    className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-auto"
                  >
                    {clientSuggestions.map((client, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onClick={() => handleClientSelect(client)}
                      >
                        {client}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {clientOptions.length} clients available
              </div>
            </div>
          </div>
          
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="candidateName">Candidate Name</Label>
              <div className="relative" ref={candidateInputRef}>
                <Input
                  id="candidateName"
                  type="text"
                  placeholder="Type to search candidates..."
                  value={candidateSearch}
                  onChange={(e) => {
                    setCandidateSearch(e.target.value);
                    setCandidateName(e.target.value);
                    setShowCandidateSuggestions(true);
                  }}
                  onFocus={() => setShowCandidateSuggestions(true)}
                  required
                  className="h-10"
                />
                {showCandidateSuggestions && candidateSuggestions.length > 0 && (
                  <div 
                    ref={candidateSuggestionsRef}
                    className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-auto"
                  >
                    {candidateSuggestions.map((candidate, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onClick={() => handleCandidateSelect(candidate)}
                      >
                        {candidate}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {candidateOptions.length} candidates available
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="sector">Sector *</Label>
              <Select value={sector} onValueChange={setSector}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select sector" />
                </SelectTrigger>
                <SelectContent>
                  {sectorOptions.map((option, index) => (
                    <SelectItem key={index} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="serviceName">Service Name *</Label>
              <Select 
                value={serviceName} 
                onValueChange={setServiceName}
                disabled={!sector}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={sector ? "Select service" : "Select sector first"} />
                </SelectTrigger>
                <SelectContent>
                  {serviceOptions.map((option, index) => (
                    <SelectItem key={index} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                  {sector && serviceOptions.length === 0 && (
                    <SelectItem value="">No services available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="status">User Status</Label>
              <Select value={currentUser?.status || 'employee'} disabled>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select user status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="founder">Founder</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="intern">Intern</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Status is managed in your profile settings</p>
            </div>
          </div>
          
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter expense details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={2}
                className="min-h-[60px]"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="overdueDays">Overdue Days</Label>
              <Input
                id="overdueDays"
                type="number"
                placeholder="Enter number of days"
                value={overdueDays}
                onChange={(e) => setOverdueDays(e.target.value)}
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                Days after which expense becomes overdue
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="overdue"
                checked={overdue}
                onCheckedChange={(checked) => setOverdue(checked as boolean)}
              />
              <Label htmlFor="overdue" className="text-sm">Mark as Overdue</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Check this box to manually mark this expense as overdue
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
                className="h-10"
              />
              <Upload className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {file && (
            <div className="p-3 border rounded-lg bg-muted/50">
              <div className="flex items-start gap-2">
                {filePreview ? (
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-lg border"
                  />
                ) : (
                  <div className="w-16 h-16 flex items-center justify-center bg-background rounded-lg border">
                    <FileText className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-sm">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full h-10 text-base font-medium" disabled={loading || isSubmitting}>
            {loading || isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              'Submit Expense'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddExpenseForm;