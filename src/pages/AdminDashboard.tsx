import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import UserManagement from '@/components/admin/UserManagement';
import AllExpensesTableEnhanced from '@/components/admin/AllExpensesTableEnhanced';
import ExpenseAnalytics from '@/components/admin/ExpenseAnalytics';
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
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { refreshData } = useData();
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
        return <ExpenseAnalytics />;
      case 'expenses':
        return <AllExpensesTableEnhanced />;
      case 'users':
        return <UserManagement />;
      default:
        return <ExpenseAnalytics />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Admin Dashboard</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeSection === 'analytics'}
                      onClick={() => setActiveSection('analytics')}
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>Analytics</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeSection === 'expenses'}
                      onClick={() => setActiveSection('expenses')}
                    >
                      <Receipt className="w-4 h-4" />
                      <span>Expenses</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeSection === 'users'}
                      onClick={() => setActiveSection('users')}
                    >
                      <Users className="w-4 h-4" />
                      <span>Users</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        
        <div className="flex flex-1 flex-col">
          <header className="border-b bg-card">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <div className="p-2 bg-primary rounded-xl">
                  <LayoutDashboard className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                  <p className="text-sm text-muted-foreground">Welcome, {user?.email}</p>
                </div>
              </div>
              <Button onClick={handleLogout} variant="outline" className="gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
            {renderActiveSection()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;