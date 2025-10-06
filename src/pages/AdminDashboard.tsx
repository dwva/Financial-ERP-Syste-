import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import UserManagement from '@/components/admin/UserManagement';
import AllExpensesTableEnhanced from '@/components/admin/AllExpensesTableEnhanced';
import FinancialOverview from '@/components/admin/FinancialOverview';
import ExpenseStatus from '@/components/admin/ExpenseStatus';
import NotificationPage from '@/components/admin/NotificationPage';
import ServiceCharges from '@/components/admin/ServiceCharges';
import InvoiceGeneration from '@/components/admin/InvoiceGeneration';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  LogOut,
  LayoutDashboard,
  BarChart3,
  Receipt,
  Users,
  Briefcase,
  Wallet,
  CheckCircle,
  Bell,
  Building,
  FileText,
  Calculator
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { refreshData } = useData();
  const { unreadCount } = useNotification();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('analytics');

  // Refresh data when component mounts
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'analytics':
        return <FinancialOverview />;
      case 'expenses':
        return <AllExpensesTableEnhanced />;
      case 'users':
        return <UserManagement />;
      case 'expense-status':
        return <ExpenseStatus />;
      case 'notifications':
        return <NotificationPage />;
      case 'service-charges':
        return <ServiceCharges />;
      case 'invoice-generation':
        return <InvoiceGeneration />;
      default:
        return <FinancialOverview />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-gray-50">
        <Sidebar className="border-r border-sidebar-border shadow-lg bg-white">
          <SidebarContent className="p-4">
            <SidebarGroup>
              <SidebarGroupLabel className="mb-4 text-lg font-bold">
                Financial ERP System
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-2">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeSection === 'analytics'}
                      onClick={() => setActiveSection('analytics')}
                      size="lg"
                      className="gap-3"
                    >
                      <BarChart3 className="w-5 h-5" />
                      <span>Financial Overview</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeSection === 'expenses'}
                      onClick={() => setActiveSection('expenses')}
                      size="lg"
                      className="gap-3"
                    >
                      <Receipt className="w-5 h-5" />
                      <span>Expense Management</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeSection === 'users'}
                      onClick={() => setActiveSection('users')}
                      size="lg"
                      className="gap-3"
                    >
                      <Users className="w-5 h-5" />
                      <span>User Management</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeSection === 'service-charges'}
                      onClick={() => setActiveSection('service-charges')}
                      size="lg"
                      className="gap-3"
                    >
                      <Calculator className="w-5 h-5" />
                      <span>Service Charges</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeSection === 'invoice-generation'}
                      onClick={() => setActiveSection('invoice-generation')}
                      size="lg"
                      className="gap-3"
                    >
                      <FileText className="w-5 h-5" />
                      <span>Invoice Generation</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeSection === 'expense-status'}
                      onClick={() => setActiveSection('expense-status')}
                      size="lg"
                      className="gap-3"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>Expense Status</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeSection === 'notifications'}
                      onClick={() => setActiveSection('notifications')}
                      size="lg"
                      className="gap-3"
                    >
                      <div className="relative">
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </div>
                      <span>Notifications</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        
        <div className="flex flex-1 flex-col">
          <header className="border-b bg-card shadow-sm">
            <div className="container mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="rounded-lg p-2 hover:bg-secondary" />
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary rounded-lg">
                    <Wallet className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">Financial ERP Dashboard</h1>
                    <p className="text-sm text-muted-foreground">Welcome, {user?.email}</p>
                  </div>
                </div>
              </div>
              <Button onClick={handleLogout} variant="outline" className="gap-2 text-base py-2 px-4 rounded-lg">
                <LogOut className="w-5 h-5" />
                Logout
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto">
              {renderActiveSection()}
            </div>
          </main>
          
          <footer className="border-t bg-card py-4">
            <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
              © {new Date().getFullYear()} Financial ERP System. All rights reserved.
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;