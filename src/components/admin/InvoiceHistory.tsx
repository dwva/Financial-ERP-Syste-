import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useData } from '@/contexts/DataContext';
import { Search, Eye, Trash2, ArrowLeft, Copy, Download } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import AlertDialog from './AlertDialog'; // Added import
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface InvoiceHistoryProps {
  onBackToGeneration?: () => void;
}

const InvoiceHistory = ({ onBackToGeneration }: InvoiceHistoryProps) => {
  const { invoiceHistory, deleteInvoiceHistory } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // State for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<{id: string, invoiceNumber: string} | null>(null);

  const filteredInvoices = invoiceHistory.filter(invoice => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      invoice.invoiceNumber?.toLowerCase().includes(term) ||
      invoice.companyName?.toLowerCase().includes(term) ||
      invoice.candidateName?.toLowerCase().includes(term)
    );
  });

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Function to download invoice as PDF
  const downloadInvoicePDF = async (invoice: any) => {
    try {
      // Create a temporary div to render the invoice
      const invoiceDiv = document.createElement('div');
      invoiceDiv.style.position = 'absolute';
      invoiceDiv.style.left = '-9999px';
      invoiceDiv.style.width = '800px';
      invoiceDiv.style.padding = '32px';
      invoiceDiv.style.backgroundColor = 'white';
      invoiceDiv.style.fontFamily = 'Arial, sans-serif';
      
      // Generate invoice HTML
      invoiceDiv.innerHTML = `
        <div style="width: 100%; max-width: 800px; margin: 0 auto; padding: 32px; background: white;">
          <!-- Company Header -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 2px solid #ccc;">
            <div>
              <!-- Logo -->
              <div style="margin-bottom: 16px;">
                <img src="/Black SD.png" alt="Company Logo" style="height: 96px; object-fit: contain;" />
              </div>
              <h1 style="font-size: 24px; font-weight: bold; color: #2563eb;">${invoice.businessName || 'Financial ERP'}</h1>
              <p style="color: #4b5563; margin-top: 4px;">${invoice.businessTagline || 'Business Solutions'}</p>
              <div style="margin-top: 16px; font-size: 14px; color: #4b5563;">
                <p>${invoice.businessAddress || '123 Corporate Avenue'}</p>
                <p>${invoice.businessCity || 'Mumbai, Maharashtra 400001'}</p>
                <p>${invoice.businessCountry || 'India'}</p>
                <p style="margin-top: 4px;">Email: ${invoice.businessEmail || 'info@financiaerpsys.com'}</p>
                <p>Phone: ${invoice.businessPhone || '+91 98765 43210'}</p>
                ${invoice.businessGST ? `<p>${invoice.businessGST}</p>` : ''}
              </div>
            </div>
            <div style="text-align: right;">
              <h2 style="font-size: 24px; font-weight: bold; color: #1f2937;">INVOICE</h2>
              <div style="margin-top: 16px; font-size: 14px;">
                <p style="font-weight: 600;">Invoice Number:</p>
                <p style="font-size: 16px;">${invoice.invoiceNumber}</p>
              </div>
            </div>
          </div>
          
          <!-- Invoice Info -->
          <div style="display: flex; justify-content: space-between; padding: 24px 0;">
            <div>
              <h3 style="font-size: 16px; font-weight: 600; color: #1f2937;">BILL TO:</h3>
              <p style="margin-top: 8px; font-weight: 500; color: #1f2937;">${invoice.companyName || 'Company Name'}</p>
              ${invoice.candidateName ? `<p style="margin-top: 4px; color: #4b5563;">Candidate: ${invoice.candidateName}</p>` : ''}
            </div>
            <div style="text-align: right;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div style="text-align: left;">
                  <p style="color: #4b5563;">Invoice Date:</p>
                  <p style="font-weight: 500;">${format(new Date(invoice.date), 'dd/MM/yyyy')}</p>
                </div>
                <div style="text-align: left;">
                  <p style="color: #4b5563;">Due Date:</p>
                  <p style="font-weight: 500;">${invoice.dueDate ? format(new Date(invoice.dueDate), 'dd/MM/yyyy') : '-'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Items Table -->
          <div style="padding: 16px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="border: 1px solid #d1d5db; padding: 12px; text-align: left; font-weight: 600;">Description</th>
                  <th style="border: 1px solid #d1d5db; padding: 12px; text-align: left; font-weight: 600;">Sector</th>
                  <th style="border: 1px solid #d1d5db; padding: 12px; text-align: right; font-weight: 600;">Quantity</th>
                  <th style="border: 1px solid #d1d5db; padding: 12px; text-align: right; font-weight: 600;">Unit Price</th>
                  <th style="border: 1px solid #d1d5db; padding: 12px; text-align: right; font-weight: 600;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items?.map((item: any) => `
                  <tr>
                    <td style="border: 1px solid #d1d5db; padding: 12px;">${item.description}</td>
                    <td style="border: 1px solid #d1d5db; padding: 12px;">${item.sector || 'N/A'}</td>
                    <td style="border: 1px solid #d1d5db; padding: 12px; text-align: right;">${item.quantity || 1}</td>
                    <td style="border: 1px solid #d1d5db; padding: 12px; text-align: right;">${formatAmount(item.amount)}</td>
                    <td style="border: 1px solid #d1d5db; padding: 12px; text-align: right;">${formatAmount((item.amount || 0) * (item.quantity || 1))}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <!-- Totals -->
          <div style="margin-left: auto; width: 100%; max-width: 200px; padding-top: 16px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tbody>
                <tr>
                  <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right; color: #4b5563;">Subtotal:</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right; font-weight: 500;">${formatAmount(invoice.subtotal)}</td>
                </tr>
                ${invoice.discount > 0 ? `
                  <tr>
                    <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right; color: #4b5563;">
                      Discount (${invoice.discountPercentage || 0}%):
                    </td>
                    <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right; font-weight: 500;">
                      -${formatAmount(invoice.discount)}
                    </td>
                  </tr>
                ` : ''}
                <tr>
                  <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right; color: #4b5563;">
                    Tax (${invoice.taxRate || 18}%):
                  </td>
                  <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right; font-weight: 500;">
                    ${formatAmount(invoice.tax)}
                  </td>
                </tr>
                <tr style="background-color: #f3f4f6; font-weight: bold;">
                  <td style="border: 1px solid #d1d5db; padding: 12px; text-align: right; font-size: 16px; color: #1f2937;">TOTAL:</td>
                  <td style="border: 1px solid #d1d5db; padding: 12px; text-align: right; font-size: 16px; color: #2563eb;">
                    ${formatAmount(invoice.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Description -->
          ${invoice.description ? `
            <div style="padding-top: 24px; border-top: 1px solid #d1d5db;">
              <h3 style="font-size: 16px; font-weight: 600; color: #1f2937;">Notes:</h3>
              <p style="margin-top: 8px; color: #4b5563;">${invoice.description}</p>
            </div>
          ` : ''}
          
          <!-- Footer -->
          <div style="padding-top: 32px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #d1d5db; margin-top: 32px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;">
              <div style="text-align: left;">
                <p style="font-weight: 600;">Authorized Signature</p>
                <img src="/signature.png" alt="Authorized Signature" style="height: 64px; object-fit: contain; margin-top: 8px;" />
              </div>
              <div style="text-align: right;">
                <p style="font-weight: 600;">For Slate Designers</p>
                <p style="margin-top: 64px;">Authorized Signatory</p>
              </div>
            </div>
            <p style="font-weight: 600;">Thank you for your business!</p>
            <p style="margin-top: 4px;">Payment is due within 30 days</p>
          </div>
          
          <!-- Additional Text Lines -->
          <div style="padding-top: 16px; text-align: center; font-size: 10px; color: #6b7280;">
            <p>This is a computer generated invoice</p>
            <p>No signature required</p>
          </div>
        </div>
      `;
      
      // Append to body
      document.body.appendChild(invoiceDiv);
      
      // Use html2canvas to capture the div
      const canvas = await html2canvas(invoiceDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      // Remove the temporary div
      document.body.removeChild(invoiceDiv);
      
      // Create PDF using jsPDF
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
      const fileName = `invoice_${invoice.invoiceNumber}_${invoice.date}.pdf`;
      pdf.save(fileName);
      
      toast.success('Invoice downloaded successfully!');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice. Please try again.');
    }
  };

  const viewInvoiceDetails = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedInvoice(null);
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (invoiceId: string, invoiceNumber: string) => {
    setInvoiceToDelete({ id: invoiceId, invoiceNumber });
    setIsDeleteDialogOpen(true);
  };

  // Close delete confirmation dialog
  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setInvoiceToDelete(null);
  };

  // Handle delete invoice
  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteInvoiceHistory(invoiceToDelete.id);
      toast.success(`Invoice ${invoiceToDelete.invoiceNumber} deleted successfully!`);
      closeDeleteDialog();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Invoice History</CardTitle>
            <CardDescription>View all generated invoices</CardDescription>
          </div>
          {onBackToGeneration && (
            <Button variant="outline" onClick={onBackToGeneration}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Invoice Generation
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Search Bar */}
        <div className="mb-4 flex items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by invoice number, company, or candidate..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Invoices Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice Number</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Company Name</TableHead>
                <TableHead>Candidate Name</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span>{invoice.invoiceNumber}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          navigator.clipboard.writeText(invoice.invoiceNumber);
                          toast.success('Invoice number copied to clipboard!');
                        }}
                        title="Copy invoice number"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{format(new Date(invoice.date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{invoice.companyName}</TableCell>
                  <TableCell>{invoice.candidateName || '-'}</TableCell>
                  <TableCell>{formatAmount(invoice.total)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => viewInvoiceDetails(invoice)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => downloadInvoicePDF(invoice)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => openDeleteDialog(invoice.id, invoice.invoiceNumber)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredInvoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No invoices found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Invoice Detail Modal */}
        {isModalOpen && selectedInvoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Invoice Details</h2>
                  <Button variant="ghost" onClick={closeModal}>×</Button>
                </div>
                
                <div className="w-full max-w-4xl mx-auto p-8 bg-white">
                  {/* Company Header */}
                  <div className="flex justify-between items-start pb-6 border-b-2 border-gray-300">
                    <div>
                      {/* Logo */}
                      <div className="mb-4">
                        <img 
                          src="/Black SD.png" 
                          alt="Company Logo" 
                          className="h-24 object-contain"
                        />
                      </div>
                      <h1 className="text-3xl font-bold text-blue-700">{selectedInvoice.businessName || 'Financial ERP'}</h1>
                      <p className="text-gray-600 mt-1">{selectedInvoice.businessTagline || 'Business Solutions'}</p>
                      <div className="mt-4 text-sm text-gray-600">
                        <p>{selectedInvoice.businessAddress || '123 Corporate Avenue'}</p>
                        <p>{selectedInvoice.businessCity || 'Mumbai, Maharashtra 400001'}</p>
                        <p>{selectedInvoice.businessCountry || 'India'}</p>
                        <p className="mt-1">Email: {selectedInvoice.businessEmail || 'info@financiaerpsys.com'}</p>
                        <p>Phone: {selectedInvoice.businessPhone || '+91 98765 43210'}</p>
                        {selectedInvoice.businessGST && (
                          <p>{selectedInvoice.businessGST}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <h2 className="text-3xl font-bold text-gray-800">INVOICE</h2>
                      <div className="mt-4 text-sm">
                        <p className="font-semibold">Invoice Number:</p>
                        <div className="flex items-center gap-2">
                          <p className="text-lg">{selectedInvoice.invoiceNumber}</p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0"
                            onClick={() => {
                              navigator.clipboard.writeText(selectedInvoice.invoiceNumber);
                              toast.success('Invoice number copied to clipboard!');
                            }}
                            title="Copy invoice number"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Invoice Info */}
                  <div className="flex justify-between py-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">BILL TO:</h3>
                      <p className="mt-2 font-medium text-gray-800">{selectedInvoice.companyName || 'Company Name'}</p>
                      {selectedInvoice.candidateName && (
                        <p className="mt-1 text-gray-600">Candidate: {selectedInvoice.candidateName}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-left">
                          <p className="text-gray-600">Invoice Date:</p>
                          <p className="font-medium">{format(new Date(selectedInvoice.date), 'dd/MM/yyyy')}</p>
                        </div>
                        <div className="text-left">
                          <p className="text-gray-600">Due Date:</p>
                          <p className="font-medium">{selectedInvoice.dueDate ? format(new Date(selectedInvoice.dueDate), 'dd/MM/yyyy') : '-'}</p>
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
                        {selectedInvoice.items?.map((item: any, index: number) => (
                          <tr key={index}>
                            <td className="border border-gray-300 py-3 px-4">{item.description}</td>
                            <td className="border border-gray-300 py-3 px-4">{item.sector || 'N/A'}</td>
                            <td className="border border-gray-300 py-3 px-4 text-right">{item.quantity || 1}</td>
                            <td className="border border-gray-300 py-3 px-4 text-right">{formatAmount(item.amount)}</td>
                            <td className="border border-gray-300 py-3 px-4 text-right">{formatAmount((item.amount || 0) * (item.quantity || 1))}</td>
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
                          <td className="border border-gray-300 py-2 px-4 text-right font-medium">{formatAmount(selectedInvoice.subtotal)}</td>
                        </tr>
                        {selectedInvoice.discount > 0 && (
                          <tr>
                            <td className="border border-gray-300 py-2 px-4 text-right text-gray-600">
                              Discount ({selectedInvoice.discountPercentage || 0}%):
                            </td>
                            <td className="border border-gray-300 py-2 px-4 text-right font-medium">
                              -{formatAmount(selectedInvoice.discount)}
                            </td>
                          </tr>
                        )}
                        <tr>
                          <td className="border border-gray-300 py-2 px-4 text-right text-gray-600">
                            Tax ({selectedInvoice.taxRate || 18}%):
                          </td>
                          <td className="border border-gray-300 py-2 px-4 text-right font-medium">
                            {formatAmount(selectedInvoice.tax)}
                          </td>
                        </tr>
                        <tr className="bg-gray-100 font-bold">
                          <td className="border border-gray-300 py-3 px-4 text-right text-lg text-gray-800">TOTAL:</td>
                          <td className="border border-gray-300 py-3 px-4 text-right text-lg text-blue-700">
                            {formatAmount(selectedInvoice.total)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Description */}
                  {selectedInvoice.description && (
                    <div className="pt-6 border-t border-gray-300">
                      <h3 className="text-lg font-semibold text-gray-800">Notes:</h3>
                      <p className="mt-2 text-gray-600">{selectedInvoice.description}</p>
                    </div>
                  )}
                  
                  {/* Footer */}
                  <div className="pt-8 text-center text-sm text-gray-500 border-t border-gray-300 mt-8">
                    <div className="flex justify-between items-center mb-8">
                      <div className="text-left">
                        <p className="font-semibold">Authorized Signature</p>
                        <img 
                          src="/signature.png" 
                          alt="Authorized Signature" 
                          className="h-16 object-contain mt-2"
                        />
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">For Slate Designers</p>
                        <p className="mt-16">Authorized Signatory</p>
                      </div>
                    </div>
                    <p className="font-semibold">Thank you for your business!</p>
                    <p className="mt-1">Payment is due within 30 days</p>
                  </div>
                  
                  {/* Additional Text Lines */}
                  <div className="pt-4 text-center text-xs text-gray-500">
                    <p>This is a computer generated invoice</p>
                    <p>No signature required</p>
                  </div>
                </div>
                
                <div className="flex justify-end mt-6">
                  <Button onClick={closeModal}>Close</Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog
          isOpen={isDeleteDialogOpen}
          onClose={closeDeleteDialog}
          onConfirm={handleDeleteInvoice}
          title="Delete Invoice"
          description={`Are you sure you want to delete invoice ${invoiceToDelete?.invoiceNumber}? This action cannot be undone.`}
          confirmText="Delete Invoice"
          isDeleting={isDeleting}
        />
      </CardContent>
    </Card>
  );
};

export default InvoiceHistory;