import { ReactNode } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, FileText, BarChart3, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardLayoutProps {
  title?: string;
  children: ReactNode;
}

export default function DashboardLayout({ title, children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();

  // Get user initials from username or email
  const getUserInitials = () => {
    if (!user) return 'U';
    const name = user.username || user.email;
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get display name (username or email)
  const getDisplayName = () => {
    if (!user) return 'User';
    // If username looks like a name (has space or is capitalized), use it
    if (user.username && (user.username.includes(' ') || user.username[0] === user.username[0].toUpperCase())) {
      return user.username;
    }
    // Otherwise, format email or username nicely
    return user.username || user.email.split('@')[0];
  };

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
    { label: 'Create Invoice', icon: FileText, to: '/dashboard/invoices/new' },
    { label: 'Invoices', icon: FileText, to: '/dashboard/invoices' },
    { label: 'Inventory', icon: Package, to: '/dashboard/inventory' },
    { label: 'Reports', icon: BarChart3, to: '/dashboard/reports' },
    { label: 'Settings', icon: Settings, to: '/dashboard/settings' },
  ];

  const handleSignOut = async () => {
    await signOut();
    // Force a full page reload to ensure all state is cleared
    // This prevents any race conditions with state updates
    window.location.href = '/auth';
  };

  return (
    <div className="h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 overflow-hidden flex">
      <aside className="hidden md:flex w-1/4 lg:w-1/6 border-r bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-col h-screen flex-shrink-0">
        <div className="p-4 border-b flex-shrink-0">
          <div className="text-xl font-bold">مؤسسة وثبة العز </div>
          <div className="text-xs text-muted-foreground">لقطع غيار التكييف والتبريد</div>
        </div>
        <nav className="p-2 space-y-1 flex-1 overflow-y-auto">
          {menuItems.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  active ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        
        {/* User Profile Section at the bottom */}
        <div className="border-t p-4 flex-shrink-0 bg-background">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white font-semibold">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-foreground truncate">
                {getDisplayName()}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {user?.email || ''}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="sticky top-0 z-10 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b flex-shrink-0">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold">{title || 'Dashboard'}</h1>
            </div>
          </div>
        </header>
        <div className="container mx-auto p-4 md:p-6 flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}


