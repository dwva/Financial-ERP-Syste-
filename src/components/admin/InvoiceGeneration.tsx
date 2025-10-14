import { useState, useRef, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-toastify';
import { Download, FileText, Search } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface InvoiceItem {
  id: string;
  description: string;
  service: string;
  amount: number;
  quantity: number;
  sector?: string; // Add sector field to invoice items
}

const InvoiceGeneration = () => {
  const { employees, serviceCharges, addInvoiceHistory } = useData();
  const [invoiceData, setInvoiceData] = useState({
    companyName: '',
    candidateName: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    sector: '',
    description: '',
    discount: 0,
    taxRate: 18,
    // Static business information
    businessName: 'Financial ERP System',
    businessTagline: 'Business Solutions',
    businessAddress: '123 Corporate Avenue',
    businessCity: 'Mumbai, Maharashtra 400001',
    businessCountry: 'India',
    businessEmail: 'info@financiaerpsys.com',
    businessPhone: '+91 98765 43210',
    businessGST: 'GSTIN: 27AABCCDDEEFFG'
  });
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Filter service charges based on search term and sort alphabetically
  const filteredServiceCharges = useMemo(() => {
    if (!searchTerm) return [...serviceCharges].sort((a, b) => a.name.localeCompare(b.name));
    return serviceCharges
      .filter(service => service.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [serviceCharges, searchTerm]);

  const handleInputChange = (field: string, value: string) => {
    setInvoiceData({ ...invoiceData, [field]: value });
  };

  const handleServiceSelect = (serviceName: string) => {
    const service = serviceCharges.find(s => s.name === serviceName);
    if (service) {
      const newItem: InvoiceItem = {
        id: Date.now().toString(),
        description: service.name,
        service: service.name,
        amount: service.amount,
        quantity: 1,
        sector: service.sector // Include sector information
      };
      setInvoiceItems([...invoiceItems, newItem]);
      setInvoiceData({ ...invoiceData, sector: '' });
      setSearchTerm('');
      toast.success('Service added to invoice!');
    }
  };

  const handleRemoveItem = (id: string) => {
    setInvoiceItems(invoiceItems.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setInvoiceItems(invoiceItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const calculateItemTotal = (item: InvoiceItem) => {
    return item.amount * item.quantity;
  };

  const calculateSubtotal = () => {
    return invoiceItems.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    return subtotal * (invoiceData.discount / 100);
  };

  const calculateTax = (amount: number) => {
    return amount * (invoiceData.taxRate / 100);
  };

  const calculateGrandTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const amountAfterDiscount = subtotal - discount;
    const tax = calculateTax(amountAfterDiscount);
    return amountAfterDiscount + tax;
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handleGenerateInvoice = () => {
    if (!invoiceData.companyName || !invoiceData.date) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (invoiceItems.length === 0) {
      toast.error('Please add at least one service item');
      return;
    }
    
    toast.success('Invoice generated successfully!');
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) {
      toast.error('Invoice preview not available');
      return;
    }
    
    try {
      // Generate PDF using html2canvas and jsPDF
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add additional pages if content is too long
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Save the PDF
      const fileName = `invoice_${invoiceData.companyName.replace(/\s+/g, '_')}_${invoiceData.date}.pdf`;
      pdf.save(fileName);
      
      // Save to invoice history
      const invoiceToSave = {
        invoiceNumber,
        date: invoiceData.date,
        dueDate: invoiceData.dueDate,
        companyName: invoiceData.companyName,
        candidateName: invoiceData.candidateName,
        businessName: invoiceData.businessName,
        businessTagline: invoiceData.businessTagline,
        businessAddress: invoiceData.businessAddress,
        businessCity: invoiceData.businessCity,
        businessCountry: invoiceData.businessCountry,
        businessEmail: invoiceData.businessEmail,
        businessPhone: invoiceData.businessPhone,
        businessGST: invoiceData.businessGST,
        items: invoiceItems,
        subtotal: calculateSubtotal(),
        discount: calculateDiscount(),
        discountPercentage: invoiceData.discount,
        tax: calculateTax(calculateSubtotal() - calculateDiscount()),
        taxRate: invoiceData.taxRate,
        total: calculateGrandTotal(),
        description: invoiceData.description
      };
      
      await addInvoiceHistory(invoiceToSave);
      
      toast.success('PDF downloaded and invoice saved to history successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Invoice Generation</CardTitle>
            <CardDescription>Create and download invoices</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleGenerateInvoice}>
              <FileText className="w-4 h-4 mr-2" />
              Generate Invoice
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6">
          {/* Business Information Section - Static */}
          <div className="border rounded-lg p-4 bg-muted">
            <h3 className="text-lg font-semibold mb-4">Business Information (Static)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Business Name</Label>
                <div className="p-2 bg-white rounded border">{invoiceData.businessName}</div>
              </div>
              <div className="space-y-2">
                <Label>Tagline</Label>
                <div className="p-2 bg-white rounded border">{invoiceData.businessTagline}</div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <div className="p-2 bg-white rounded border">{invoiceData.businessAddress}</div>
              </div>
              <div className="space-y-2">
                <Label>City, State & ZIP</Label>
                <div className="p-2 bg-white rounded border">{invoiceData.businessCity}</div>
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <div className="p-2 bg-white rounded border">{invoiceData.businessCountry}</div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="p-2 bg-white rounded border">{invoiceData.businessEmail}</div>
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <div className="p-2 bg-white rounded border">{invoiceData.businessPhone}</div>
              </div>
              <div className="space-y-2">
                <Label>GST Number</Label>
                <div className="p-2 bg-white rounded border">{invoiceData.businessGST}</div>
              </div>
            </div>
          </div>

          {/* Invoice Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name (TO) *</Label>
                <Input
                  id="companyName"
                  placeholder="Enter company name"
                  value={invoiceData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="candidateName">Candidate Name</Label>
                <Input
                  id="candidateName"
                  placeholder="Enter candidate name"
                  value={invoiceData.candidateName}
                  onChange={(e) => handleInputChange('candidateName', e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Invoice Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={invoiceData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={invoiceData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Enter discount percentage"
                    value={invoiceData.discount}
                    onChange={(e) => handleInputChange('discount', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Enter tax rate"
                    value={invoiceData.taxRate}
                    onChange={(e) => handleInputChange('taxRate', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sector">Sector/Service *</Label>
                <div className="relative">
                  <div className="flex items-center">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="sector"
                      placeholder="Search and select service"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {searchTerm && (
                    <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredServiceCharges.length > 0 ? (
                        filteredServiceCharges.map((service) => (
                          <div
                            key={service.id}
                            className="px-4 py-2 hover:bg-muted cursor-pointer flex justify-between items-center"
                            onClick={() => handleServiceSelect(service.name)}
                          >
                            <div>
                              <span>{service.name}</span>
                              {service.sector && (
                                <span className="text-xs text-muted-foreground ml-2">({service.sector})</span>
                              )}
                            </div>
                            <span className="text-muted-foreground">{formatAmount(service.amount)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-muted-foreground">No services found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter description"
                  value={invoiceData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            
            {/* Invoice Preview */}
            <div className="border rounded-lg p-6 bg-white">
              <div ref={invoiceRef} className="w-full max-w-4xl mx-auto p-8 bg-white">
                {/* Company Header */}
                <div className="flex justify-between items-start pb-6 border-b-2 border-gray-300">
                  <div>
                    {/* Logo */}
                    <div className="mb-4">
                      <img 
                        src="/Slate Designers (black bg) .png" 
                        alt="Company Logo" 
                        className="h-16 object-contain"
                      />
                    </div>
                    <h1 className="text-3xl font-bold text-blue-700">{invoiceData.businessName}</h1>
                    <p className="text-gray-600 mt-1">{invoiceData.businessTagline}</p>
                    <div className="mt-4 text-sm text-gray-600">
                      <p>{invoiceData.businessAddress}</p>
                      <p>{invoiceData.businessCity}</p>
                      <p>{invoiceData.businessCountry}</p>
                      <p className="mt-1">Email: {invoiceData.businessEmail}</p>
                      <p>Phone: {invoiceData.businessPhone}</p>
                      <p>{invoiceData.businessGST}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="text-3xl font-bold text-gray-800">INVOICE</h2>
                    <div className="mt-4 text-sm">
                      <p className="font-semibold">Invoice Number:</p>
                      <p className="text-lg">{invoiceNumber}</p>
                    </div>
                  </div>
                </div>
                
                {/* Invoice Info */}
                <div className="flex justify-between py-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">BILL TO:</h3>
                    <p className="mt-2 font-medium text-gray-800">{invoiceData.companyName || 'Company Name'}</p>
                    {invoiceData.candidateName && (
                      <p className="mt-1 text-gray-600">Candidate: {invoiceData.candidateName}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-left">
                        <p className="text-gray-600">Invoice Date:</p>
                        <p className="font-medium">{invoiceData.date}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-gray-600">Due Date:</p>
                        <p className="font-medium">{invoiceData.dueDate}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Items Table */}
                <div className="py-4">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 py-3 px-4 text-left font-semibold">Description</th>
                        <th className="border border-gray-300 py-3 px-4 text-left font-semibold">Sector</th>
                        <th className="border border-gray-300 py-3 px-4 text-right font-semibold">Quantity</th>
                        <th className="border border-gray-300 py-3 px-4 text-right font-semibold">Unit Price</th>
                        <th className="border border-gray-300 py-3 px-4 text-right font-semibold">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceItems.map((item) => (
                        <tr key={item.id}>
                          <td className="border border-gray-300 py-3 px-4">{item.description}</td>
                          <td className="border border-gray-300 py-3 px-4">{item.sector || 'N/A'}</td>
                          <td className="border border-gray-300 py-3 px-4 text-right">{item.quantity}</td>
                          <td className="border border-gray-300 py-3 px-4 text-right">{formatAmount(item.amount)}</td>
                          <td className="border border-gray-300 py-3 px-4 text-right">{formatAmount(calculateItemTotal(item))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Totals */}
                <div className="ml-auto w-full max-w-xs pt-4">
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 py-2 px-4 text-right text-gray-600">Subtotal:</td>
                        <td className="border border-gray-300 py-2 px-4 text-right font-medium">{formatAmount(calculateSubtotal())}</td>
                      </tr>
                      {invoiceData.discount > 0 && (
                        <tr>
                          <td className="border border-gray-300 py-2 px-4 text-right text-gray-600">Discount ({invoiceData.discount}%):</td>
                          <td className="border border-gray-300 py-2 px-4 text-right font-medium">-{formatAmount(calculateDiscount())}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="border border-gray-300 py-2 px-4 text-right text-gray-600">Tax ({invoiceData.taxRate}%):</td>
                        <td className="border border-gray-300 py-2 px-4 text-right font-medium">{formatAmount(calculateTax(calculateSubtotal() - calculateDiscount()))}</td>
                      </tr>
                      <tr className="bg-gray-100 font-bold">
                        <td className="border border-gray-300 py-3 px-4 text-right text-lg text-gray-800">TOTAL:</td>
                        <td className="border border-gray-300 py-3 px-4 text-right text-lg text-blue-700">{formatAmount(calculateGrandTotal())}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                {/* Description */}
                {invoiceData.description && (
                  <div className="pt-6 border-t border-gray-300">
                    <h3 className="text-lg font-semibold text-gray-800">Notes:</h3>
                    <p className="mt-2 text-gray-600">{invoiceData.description}</p>
                  </div>
                )}
                
                {/* Footer */}
                <div className="pt-8 text-center text-sm text-gray-500 border-t border-gray-300 mt-8">
                  <p className="font-semibold">Thank you for your business!</p>
                  <p className="mt-1">Payment is due within 30 days</p>
                </div>
                
                {/* Additional Text Lines */}
                <div className="pt-4 text-center text-xs text-gray-500">
                  <p>This is a computer generated invoice</p>
                  <p>No signature required</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Invoice Items Table */}
        <div className="mt-6 border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3">Service</th>
                <th className="text-left p-3">Description</th>
                <th className="text-left p-3">Sector</th>
                <th className="text-right p-3">Quantity</th>
                <th className="text-right p-3">Unit Price</th>
                <th className="text-right p-3">Amount</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoiceItems.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="p-3">{item.service}</td>
                  <td className="p-3">
                    <Input
                      value={item.description}
                      onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                      className="w-full"
                    />
                  </td>
                  <td className="p-3">
                    <Input
                      value={item.sector || ''}
                      onChange={(e) => handleItemChange(item.id, 'sector', e.target.value)}
                      className="w-full"
                      placeholder="Sector"
                    />
                  </td>
                  <td className="p-3">
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-full text-right"
                    />
                  </td>
                  <td className="p-3">
                    <Input
                      type="number"
                      value={item.amount}
                      onChange={(e) => handleItemChange(item.id, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-full text-right"
                    />
                  </td>
                  <td className="p-3 text-right">{formatAmount(calculateItemTotal(item))}</td>
                  <td className="p-3 text-right">
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
              {invoiceItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">
                    No items added to invoice
                  </td>
                </tr>
              )}
              <tr className="bg-muted font-semibold">
                <td colSpan={4} className="p-3 text-right">Subtotal:</td>
                <td className="p-3 text-right">{formatAmount(calculateSubtotal())}</td>
                <td></td>
              </tr>
              {invoiceData.discount > 0 && (
                <tr className="bg-muted font-semibold">
                  <td colSpan={4} className="p-3 text-right">Discount ({invoiceData.discount}%):</td>
                  <td className="p-3 text-right">-{formatAmount(calculateDiscount())}</td>
                  <td></td>
                </tr>
              )}
              <tr className="bg-muted font-semibold">
                <td colSpan={4} className="p-3 text-right">Tax ({invoiceData.taxRate}%):</td>
                <td className="p-3 text-right">{formatAmount(calculateTax(calculateSubtotal() - calculateDiscount()))}</td>
                <td></td>
              </tr>
              <tr className="bg-muted font-bold text-lg">
                <td colSpan={4} className="p-3 text-right">Total:</td>
                <td className="p-3 text-right">{formatAmount(calculateGrandTotal())}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceGeneration;