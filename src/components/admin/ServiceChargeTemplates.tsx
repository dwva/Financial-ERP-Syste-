import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';

const ServiceChargeTemplates = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Charge Import Templates</CardTitle>
        <CardDescription>
          Download Excel/CSV templates for importing service charges
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Basic Template</h3>
            <p className="text-sm text-muted-foreground mb-3">
              A simple template with sample service charges across different sectors.
            </p>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <a 
                  href="/service-charges-template.csv" 
                  download="service-charges-template.csv"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download CSV Template
                </a>
              </Button>
              <Button asChild variant="outline">
                <a 
                  href="/service-charges-template.xlsx" 
                  download="service-charges-template.xlsx"
                  className="gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Download Excel Template
                </a>
              </Button>
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Detailed Template</h3>
            <p className="text-sm text-muted-foreground mb-3">
              A comprehensive template with more service charge examples across various sectors.
            </p>
            <Button asChild variant="outline">
              <a 
                href="/service-charges-detailed-template.csv" 
                download="service-charges-detailed-template.csv"
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download Detailed CSV Template
              </a>
            </Button>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Import Guide</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Documentation on how to format your Excel/CSV files for importing service charges.
            </p>
            <Button asChild variant="outline">
              <a 
                href="/service-charges-import-guide.md" 
                download="service-charges-import-guide.md"
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                Download Import Guide
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceChargeTemplates;