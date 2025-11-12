import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Wallet, 
  Users, 
  FileText, 
  Bell, 
  FileSpreadsheet,
  History,
  TrendingUp,
  Mail,
  ChevronLeft,
  ChevronRight,
  LogOut,
  AlertTriangle,
  Settings
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';

interface MovableSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  unreadCount: number;
  user: { email: string | null } | null;
  onLogout: () => void;
  isMobile?: boolean;
}

const MovableSidebar = ({ 
  activeSection, 
  setActiveSection, 
  unreadCount, 
  user, 
  onLogout,
  isMobile = false
}: MovableSidebarProps) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(!isMobile);
  const [overdueCount, setOverdueCount] = useState(0);
  const { expenses } = useData();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Calculate overdue expenses count
  useEffect(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const overdue = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const isOverdue = expenseDate < thirtyDaysAgo;
      const isNotReceived = (expense.status || 'pending') !== 'received';
      
      return isOverdue && isNotReceived;
    });
    
    setOverdueCount(overdue.length);
  }, [expenses]);

  const menuItems = [
    { id: 'analytics', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expense-overview', label: 'Expenses Overview', icon: FileText },
    { id: 'expenses', label: 'All Expenses', icon: Wallet },
    { id: 'expense-status', label: 'Expense Status', icon: FileText },
    { id: 'invoice-generation', label: 'Invoice Generation', icon: FileText },
    { id: 'overdue-expenses', label: 'Overdue Expenses', icon: AlertTriangle },
    { id: 'profit-loss', label: 'Profit & Loss', icon: TrendingUp },
    { id: 'service-charges', label: 'Service Charges', icon: FileSpreadsheet },
    { id: 'dropdown-manager', label: 'Data Management', icon: Settings },
    { id: 'users', label: 'User Management', icon: Users }
  ];

  // Reset position when switching between mobile and desktop
  useEffect(() => {
    if (isMobile) {
      setSidebarExpanded(false); // Collapse sidebar on mobile by default
    } else {
      setSidebarExpanded(true); // Expand sidebar on desktop by default
    }
  }, [isMobile]);

  return (
    <div 
      ref={sidebarRef}
      style={{
        width: isMobile ? '100%' : sidebarExpanded ? '16rem' : '5rem',
        height: '100%',
        maxHeight: '100vh',
        marginTop: !isMobile ? '4rem' : '0'
      }}
      className="bg-white shadow-lg flex flex-col"
    >
      <div className="p-3 border-b border-grey-200 flex items-center justify-between">
        {sidebarExpanded && (
          <h1 className="text-base font-semibold text-foreground font-body">Admin Dashboard</h1>
        )}
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setSidebarExpanded(!sidebarExpanded)}
          className="ml-auto p-2"
        >
          {sidebarExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
      
      <nav className="mt-3 px-2 flex-1 overflow-y-auto space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveSection(item.id);
                if (isMobile) {
                  // Close sidebar on mobile after selecting a section
                  const sidebarContainer = sidebarRef.current?.parentElement;
                  if (sidebarContainer) {
                    setTimeout(() => {
                      const closeEvent = new CustomEvent('click', { bubbles: true });
                      sidebarContainer.dispatchEvent(closeEvent);
                    }, 100);
                  }
                }
              }}
              className={`w-full flex items-center px-3 py-2 text-left transition-all duration-300 rounded-lg ${
                activeSection === item.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-muted'
              }`}
              style={{ fontSize: '0.8rem' }}
            >
              <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
              {sidebarExpanded && (
                <span className="flex items-center font-body truncate">
                  {item.label}
                  {item.id === 'notifications' && unreadCount > 0 && (
                    <span className="ml-2 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center flex-shrink-0">
                      {unreadCount}
                    </span>
                  )}
                  {item.id === 'overdue-expenses' && overdueCount > 0 && (
                    <span className="ml-2 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center flex-shrink-0">
                      {overdueCount}
                    </span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default MovableSidebar;