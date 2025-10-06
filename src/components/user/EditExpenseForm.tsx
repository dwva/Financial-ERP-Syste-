import { useState, useEffect } from 'react';
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
import { PlusCircle, Upload, X, FileText, Image as ImageIcon, Calendar, Save } from 'lucide-react';

interface EditExpenseFormProps {
  expense: any;
  onCancel: () => void;
  onSave: () => void;
}

const EditExpenseForm = ({ expense, onCancel, onSave }: EditExpenseFormProps) => {
  const { updateExpense, refreshData } = useData();
  const [amount, setAmount] = useState(expense.amount.toString());
  const [description, setDescription] = useState(expense.description);
  const [date, setDate] = useState(expense.date);
  const [company, setCompany] = useState(expense.company);
  const [sector, setSector] = useState(expense.sector);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(expense.file);
  const [fileName, setFileName] = useState<string | null>(expense.fileName);
  const [loading, setLoading] = useState(false);

  // Removed additional fields functionality

  // Removed additional fields useEffect

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

  // Removed additional fields handlers

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
        sector,
        file: fileBase64,
        fileName: fileName
      };

      console.log('Updating expense data:', expenseData);
      
      await updateExpense(expense.id, expenseData);

      toast.success('Expense updated successfully!');
      
      // Refresh data to show the updated expense
      await refreshData();
      
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

          {/* Additional Fields Section Removed */}

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