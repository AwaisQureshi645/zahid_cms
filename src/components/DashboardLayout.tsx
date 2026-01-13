import { ReactNode, useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, FileText, BarChart3, Settings, LogOut, Menu, X, Receipt } from 'lucide-react';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(80);

  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
  }, []);

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
    { label: 'Purchases', icon: Package, to: '/dashboard/purchases' },
    { label: 'Reports', icon: BarChart3, to: '/dashboard/reports' },
    { label: 'Case Without TAX', icon: Receipt, to: '/dashboard/case-without-tax' },
    { label: 'Settings', icon: Settings, to: '/dashboard/settings' },
  ];

  const handleSignOut = async () => {
    await signOut();
    // Force a full page reload to ensure all state is cleared
    // This prevents any race conditions with state updates
    window.location.href = '/auth';
  };

  return (
    <div className="h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 overflow-hidden flex flex-col">
      {/* Header with Arabic name */}
      <header ref={headerRef} className="sticky top-0 z-20 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b flex-shrink-0">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-xl md:text-2xl font-bold">مؤسسة وثبة العز</div>
              <div className="text-xs text-muted-foreground">لقطع غيار التكييف والتبريد</div>
            </div>
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-semibold">{title || 'Dashboard'}</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Hamburger button when sidebar is closed - positioned below header */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-4 left-4 z-50 p-2 rounded-md bg-white border shadow-md hover:bg-gray-100 transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>
        )}

        {/* Sidebar */}
        <aside 
          className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed md:fixed z-40 w-64 md:w-1/4 lg:w-1/6 border-r bg-white flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out shadow-lg`}
          style={{ 
            top: `${headerHeight}px`, 
            height: `calc(100vh - ${headerHeight}px)` 
          }}
        >
          <div className="p-4 border-b flex-shrink-0 flex items-center justify-end">
            {/* Close button inside sidebar */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
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
                    active 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-gray-100 hover:bg-gray-200 text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
          
          {/* User Profile Section at the bottom */}
          <div className="border-t p-4 flex-shrink-0 bg-white">
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
        
        {/* Overlay when sidebar is open */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="container mx-auto p-4 md:p-6 flex-1 overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}


