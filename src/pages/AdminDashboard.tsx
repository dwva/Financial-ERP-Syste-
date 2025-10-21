import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Wallet, 
  Users, 
  FileText, 
  Bell, 
  Settings, 
  LogOut,
  FileSpreadsheet,
  History,
  TrendingUp,
  Mail
} from 'lucide-react';
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
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
      case 'notifications':
        return <NotificationPage />;
      case 'service-charges':
        return <ServiceCharges />;
      case 'invoice-generation':
        return <InvoiceGeneration />;
      case 'invoice-history':
        return <InvoiceHistory />;
      case 'profit-loss':
        return <ProfitLoss />;
      case 'messages':
        return <MessageUser />;
      default:
        return <FinancialOverview />;
    }
  };

  const menuItems = [
    { id: 'analytics', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expenses', label: 'All Expenses', icon: Wallet },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'expense-status', label: 'Expense Status', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'service-charges', label: 'Service Charges', icon: FileSpreadsheet },
    { id: 'invoice-generation', label: 'Invoice Generation', icon: FileText },
    { id: 'invoice-history', label: 'Invoice History', icon: History },
    { id: 'profit-loss', label: 'Profit & Loss', icon: TrendingUp },
    { id: 'messages', label: 'Messages', icon: Mail },
  ];

  // Get user initials for avatar
  const getUserInitials = (email: string | null) => {
    if (!email) return 'AD';
    const name = email.split('@')[0];
    return name.length > 1 ? name.substring(0, 2).toUpperCase() : name.toUpperCase();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
        </div>
        <nav className="mt-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center px-4 py-3 text-left transition-colors ${
                  activeSection === item.id
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span className="flex items-center">
                  {item.label}
                  {item.id === 'notifications' && unreadCount > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </nav>
        <div className="absolute bottom-0 w-64 p-4 border-t">
          {/* Admin Info */}
          <div className="flex items-center gap-3 mb-4 p-2 bg-muted rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{getUserInitials(user?.email)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.email || 'Admin User'}</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
          </div>
          
          {/* Logout Button */}
          <Button 
            onClick={handleLogout}
            variant="outline" 
            className="w-full flex items-center justify-center"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {renderActiveSection()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;