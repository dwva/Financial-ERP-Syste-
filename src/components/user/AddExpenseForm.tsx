import { useState } from 'react';
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
import { toast } from 'react-toastify';
import { PlusCircle, Upload, X, FileText, Image as ImageIcon, Calendar } from 'lucide-react';

const AddExpenseForm = () => {
  const { user } = useAuth();
  const { addExpense, refreshData, employees } = useData();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [company, setCompany] = useState('');
  const [sector, setSector] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Get current user data
  const currentUser = employees.find(emp => emp.email === user?.email);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('User not authenticated');
      return;
    }
    
    if (!amount || !date || !company || !sector || !description) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    
    try {
      // Convert file to base64 if it exists
      let fileBase64 = null;
      if (file) {
        fileBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      // Create expense object with correct properties
      const expenseData = {
        userId: user.email || '',
        amount: parseFloat(amount),
        description,
        date,
        company,
        sector,
        file: fileBase64,
        fileName: file?.name || null,
      };

      console.log('Submitting expense data:', expenseData);
      
      await addExpense(expenseData);

      toast.success('Expense added successfully!');
      setAmount('');
      setDescription('');
      setDate('');
      setCompany('');
      setSector('');
      setFile(null);
      setFilePreview(null);
      
      // Refresh data to show the new expense
      await refreshData();
    } catch (error: any) {
      console.error('Error adding expense:', error);
      toast.error(`Failed to add expense: ${error.message || 'Please try again'}`);
    } finally {
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
              <Input
                id="company"
                type="text"
                placeholder="Enter company name"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sector">Sector</Label>
              <Input
                id="sector"
                type="text"
                placeholder="Enter sector"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                required
                className="h-11"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">User Status</Label>
            <Select value={currentUser?.status || 'employee'} disabled>
              <SelectTrigger className="h-11">
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
            <p className="text-sm text-muted-foreground">Status is managed in your profile settings</p>
          </div>
          
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

          {file && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-start gap-3">
                {filePreview ? (
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
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
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

          <Button type="submit" className="w-full h-11 text-base font-medium" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Expense'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddExpenseForm;