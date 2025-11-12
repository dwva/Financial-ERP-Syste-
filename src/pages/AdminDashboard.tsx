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
import MovableSidebar from '@/components/admin/MovableSidebar';
import OverdueExpenses from '@/components/admin/OverdueExpenses';
import DataManagement from '@/components/admin/DataManagement';
import ExpensesOverview from '@/components/admin/ExpensesOverview';
import MessageUser from '@/components/admin/MessageUser';
import { Button } from '@/components/ui/button';
import { Bell, LogOut, Menu, X, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('analytics');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { user, logout } = useAuth();
  const { unreadCount } = useNotification();
  const navigate = useNavigate();

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

  const handleNotificationClick = () => {
    setActiveSection('notifications');
    if (isMobile) {
      setSidebarOpen(false);
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
      {/* Navbar for desktop */}
      {!isMobile && (
        <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b z-30 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <img 
              src="/mio.png" 
              alt="Logo" 
              className="h-8 object-contain"
            />
          </div>
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <Button 
              variant="ghost" 
              size="icon"
              className="relative h-10 w-10 rounded-full"
              onClick={handleNotificationClick}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                  {unreadCount}
                </span>
              )}
            </Button>
            
            {/* Mail Icon - navigates to messages page */}
            <Button 
              variant="ghost" 
              size="icon"
              className="relative h-10 w-10 rounded-full"
              onClick={() => {
                setActiveSection('messages');
                if (isMobile) {
                  setSidebarOpen(false);
                }
              }}
            >
              <Mail className="h-5 w-5" />
            </Button>
            
            {/* Admin Name moved to the right side */}
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {user?.email ? user.email.split('@')[0] : 'Admin'}
                </p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
            </div>
            
            {/* Logout Button */}
            <Button 
              variant="outline" 
              size="sm"
              className="h-10 gap-1 px-3"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Logout</span>
            </Button>
          </div>
        </div>
      )}
      
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
      
      {/* Mobile navbar */}
      {isMobile && (
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b z-20 flex items-center justify-between px-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img 
              src="/mio.png" 
              alt="Logo" 
              className="h-8 object-contain"
            />
          </div>
          
          {/* Notification Bell, Admin Name, and Logout */}
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              className="relative h-10 w-10 rounded-full"
              onClick={handleNotificationClick}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                  {unreadCount}
                </span>
              )}
            </Button>
            
            {/* Mail Icon - navigates to messages page */}
            <Button 
              variant="ghost" 
              size="icon"
              className="relative h-10 w-10 rounded-full"
              onClick={() => {
                setActiveSection('messages');
                if (isMobile) {
                  setSidebarOpen(false);
                }
              }}
            >
              <Mail className="h-5 w-5" />
            </Button>
            
            {/* Admin Name */}
            <div className="hidden sm:block text-right mr-2">
              <p className="text-xs font-medium text-foreground">
                {user?.email ? user.email.split('@')[0] : 'Admin'}
              </p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              className="h-10 gap-1 px-3"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Movable Sidebar */}
      <div className={
        isMobile 
          ? `fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } w-full max-w-xs`
          : 'flex flex-shrink-0'
      }>
        {isMobile && (
          <div className="absolute top-4 right-4 z-50">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSidebarOpen(false)}
              className="rounded-full p-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
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
      <div className={`flex-1 overflow-auto bg-grey-50 ${!isMobile ? 'pt-20' : 'pt-16'}`}>
        <div className="p-4 md:p-6">
          {renderActiveSection()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;