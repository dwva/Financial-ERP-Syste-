import { useState } from 'react';
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
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('analytics');
  const { user, logout } = useAuth();
  const { unreadCount } = useNotification();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
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
        return <InvoiceHistory />;
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
    <div className="flex h-screen bg-grey-100">
      {/* Movable Sidebar */}
      <MovableSidebar 
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        unreadCount={unreadCount}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-grey-50">
        <div className="p-6">
          {renderActiveSection()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;