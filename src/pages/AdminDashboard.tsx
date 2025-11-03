import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import FinancialOverview from '@/components/admin/FinancialOverview';
import AllExpensesTableEnhanced from '@/components/admin/AllExpensesTableEnhanced';
import UserManagement from '@/components/admin/UserManagement';
import ExpenseStatus from '@/components/admin/ExpenseStatus';
import NotificationPage from '@/components/admin/NotificationPage';
import ServiceCharges from '@/components/admin/ServiceCharges';
import InvoiceGeneration from '@/components/admin/InvoiceGeneration';
import InvoiceHistory from '@/components/admin/InvoiceHistory';
import ProfitLoss from '@/components/admin/ProfitLoss';
import MessageUser from '@/components/admin/MessageUser';
import MovableSidebar from '@/components/admin/MovableSidebar';
import OverdueExpenses from '@/components/admin/OverdueExpenses';
import DataManagement from '@/components/admin/DataManagement';
import ExpensesOverview from '@/components/admin/ExpensesOverview';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('analytics');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { user, logout } = useAuth();
  const { unreadCount } = useNotification();

  // Handle window resize to detect mobile/desktop
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Close sidebar on mobile when resizing to desktop
      if (!mobile) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation is now handled by ProtectedRoute component
      // No need to manually navigate to /login
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'analytics':
        return <FinancialOverview />;
      case 'expenses':
        return <AllExpensesTableEnhanced />;
      case 'expense-overview':
        return <ExpensesOverview />;
      case 'users':
        return <UserManagement />;
      case 'expense-status':
        return <ExpenseStatus />;
      case 'overdue-expenses':
        return <OverdueExpenses />;
      case 'notifications':
        return <NotificationPage />;
      case 'service-charges':
        return <ServiceCharges />;
      case 'invoice-generation':
        return <InvoiceGeneration onNavigateToHistory={() => setActiveSection('invoice-history')} />;
      case 'invoice-history':
        return <InvoiceHistory onBackToGeneration={() => setActiveSection('invoice-generation')} />;
      case 'profit-loss':
        return <ProfitLoss />;
      case 'messages':
        return <MessageUser />;
      case 'dropdown-manager':
        return <DataManagement />;
      default:
        return <FinancialOverview />;
    }
  };

  return (
    <div className="flex h-screen bg-grey-100 overflow-hidden">
      {/* Mobile menu button */}
      {isMobile && (
        <div className="md:hidden absolute top-4 left-4 z-30">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Movable Sidebar */}
      <div className={
        isMobile 
          ? `fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`
          : 'flex flex-shrink-0'
      }>
        <MovableSidebar 
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          unreadCount={unreadCount}
          user={user}
          onLogout={handleLogout}
          isMobile={isMobile}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-grey-50">
        <div className="p-4 md:p-6">
          {renderActiveSection()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;