import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, FileText, BarChart3, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardLayout from '@/components/DashboardLayout';

export default function Dashboard() {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: 'Create Invoice',
      description: 'Generate new invoices for customers',
      icon: FileText,
      path: '/dashboard/invoices/new',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Inventory',
      description: 'Manage your products and stock',
      icon: Package,
      path: '/dashboard/inventory',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Invoices',
      description: 'View and manage all invoices',
      icon: LayoutDashboard,
      path: '/dashboard/invoices',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Reports',
      description: 'Analytics and insights',
      icon: BarChart3,
      path: '/dashboard/reports',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Settings',
      description: 'Company and system settings',
      icon: Settings,
      path: '/dashboard/settings',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
  ];

  return (
    <DashboardLayout title="AC POS Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.path}
              className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
              onClick={() => navigate(item.path)}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${item.bgColor} flex items-center justify-center mb-3`}>
                  <Icon className={`h-6 w-6 ${item.color}`} />
                </div>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
