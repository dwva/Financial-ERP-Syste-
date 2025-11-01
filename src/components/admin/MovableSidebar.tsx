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
  GripVertical,
  LogOut,
  AlertTriangle,
  Settings
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [sidebarPosition, setSidebarPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
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
    { id: 'expenses', label: 'All Expenses', icon: Wallet },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'expense-status', label: 'Expense Status', icon: FileText },
    { id: 'overdue-expenses', label: 'Overdue Expenses', icon: AlertTriangle },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'service-charges', label: 'Service Charges', icon: FileSpreadsheet },
    { id: 'invoice-generation', label: 'Invoice Generation', icon: FileText },
    { id: 'profit-loss', label: 'Profit & Loss', icon: TrendingUp },
    { id: 'messages', label: 'Messages', icon: Mail },
    { id: 'dropdown-manager', label: 'Data Management', icon: Settings },
  ];

  // Get user initials for avatar
  const getUserInitials = (email: string | null) => {
    if (!email) return 'AD';
    const name = email.split('@')[0];
    return name.length > 1 ? name.substring(0, 2).toUpperCase() : name.toUpperCase();
  };

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow dragging on desktop
    if (isMobile || !sidebarRef.current) return;
    
    const rect = sidebarRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
  };

  // Handle mouse move for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && sidebarRef.current && !isMobile) {
        // Constrain dragging within viewport
        const sidebarRect = sidebarRef.current.getBoundingClientRect();
        const maxX = window.innerWidth - sidebarRect.width;
        const maxY = window.innerHeight - sidebarRect.height;
        
        const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, maxX));
        const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, maxY));
        
        setSidebarPosition({
          x: newX,
          y: newY
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, isMobile]);

  // Reset position when switching between mobile and desktop
  useEffect(() => {
    if (isMobile) {
      setSidebarPosition({ x: 0, y: 0 });
    }
  }, [isMobile]);

  return (
    <div 
      ref={sidebarRef}
      style={{
        position: isMobile ? 'relative' : isDragging ? 'fixed' : 'sticky',
        left: isMobile ? 'auto' : isDragging ? sidebarPosition.x : 'auto',
        top: isMobile ? 'auto' : isDragging ? sidebarPosition.y : 'auto',
        zIndex: isMobile ? 'auto' : isDragging ? 1000 : 'auto',
        width: sidebarExpanded ? '16rem' : '5rem',
        transition: isDragging ? 'none' : 'width 0.3s ease',
        height: '100%',
        maxHeight: '100vh'
      }}
      className="bg-white rounded-r-3xl shadow-lg flex flex-col"
    >
      {/* Drag handle - only show on desktop */}
      {!isMobile && (
        <div 
          className="absolute top-0 right-0 w-2 h-full cursor-move z-10"
          onMouseDown={handleMouseDown}
        />
      )}
      
      <div className="p-4 border-b border-grey-200 flex items-center justify-between">
        {sidebarExpanded && (
          <h1 className="text-lg font-semibold text-grey-800 font-body">Admin Dashboard</h1>
        )}
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setSidebarExpanded(!sidebarExpanded)}
          className="ml-auto"
        >
          {sidebarExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
      
      <nav className="mt-4 px-2 flex-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center px-3 py-2.5 text-left transition-all duration-300 rounded-xl mb-1 ${
                activeSection === item.id
                  ? 'bg-violet-100 text-violet-700'
                  : 'text-grey-600 hover:bg-grey-100'
              }`}
              style={{ fontSize: '0.875rem' }}
            >
              <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
              {sidebarExpanded && (
                <span className="flex items-center font-body truncate">
                  {item.label}
                  {item.id === 'notifications' && unreadCount > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center flex-shrink-0">
                      {unreadCount}
                    </span>
                  )}
                  {item.id === 'overdue-expenses' && overdueCount > 0 && (
                    <span className="ml-2 bg-orange-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center flex-shrink-0">
                      {overdueCount}
                    </span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-grey-200">
        {/* Admin Info */}
        <div className="flex items-center gap-2 mb-3 p-2 bg-grey-100 rounded-xl">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="text-xs">{getUserInitials(user?.email)}</AvatarFallback>
          </Avatar>
          {sidebarExpanded && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate font-body">{user?.email || 'Admin User'}</p>
              <p className="text-xs text-grey-500 font-body">Administrator</p>
            </div>
          )}
        </div>
        
        {/* Logout Button */}
        <Button 
          onClick={onLogout}
          variant="outline" 
          className="w-full flex items-center justify-center rounded-xl text-xs font-body py-2"
        >
          <LogOut className="h-3 w-3 mr-2" />
          {sidebarExpanded ? 'Logout' : ''}
        </Button>
      </div>
    </div>
  );
};

export default MovableSidebar;