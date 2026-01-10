import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { apiGet, apiPut, apiPost } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/DashboardLayout';

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    company_name_en: '',
    company_name_ar: '',
    phone: '',
    vat_id: '',
    address_en: '',
    address_ar: '',
  });

  useEffect(() => {
    fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;
    
    try {
      const data = await apiGet<any>('/api/company-settings');
      if (data && Object.keys(data).length > 0) {
        setFormData({
          company_name_en: data.company_name_en || '',
          company_name_ar: data.company_name_ar || '',
          phone: data.phone || '',
          vat_id: data.vat_id || '',
          address_en: data.address_en || '',
          address_ar: data.address_ar || '',
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      // Try to update first, if it fails, create new
      try {
        await apiPut('/api/company-settings', formData);
        toast({ title: 'Settings saved successfully' });
      } catch (updateError: any) {
        // If update fails (404), create new
        if (updateError.message && updateError.message.includes('404')) {
          await apiPost('/api/company-settings', { ...formData, user_id: user.id });
          toast({ title: 'Settings saved successfully' });
        } else {
          throw updateError;
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        variant: 'destructive',
      });
    }
  };

  return (
    <DashboardLayout title="Company Settings">
      <div className="">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
       
          </div>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Name (English)</Label>
                <Input
                  value={formData.company_name_en}
                  onChange={(e) => setFormData({ ...formData, company_name_en: e.target.value })}
                  placeholder="Company Name"
                />
              </div>
              <div className="space-y-2">
                <Label>Company Name (Arabic)</Label>
                <Input
                  value={formData.company_name_ar}
                  onChange={(e) => setFormData({ ...formData, company_name_ar: e.target.value })}
                  placeholder="اسم الشركة"
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
              <div className="space-y-2">
                <Label>VAT ID</Label>
                <Input
                  value={formData.vat_id}
                  onChange={(e) => setFormData({ ...formData, vat_id: e.target.value })}
                  placeholder="VAT ID"
                />
              </div>
              <div className="space-y-2">
                <Label>Address (English)</Label>
                <Input
                  value={formData.address_en}
                  onChange={(e) => setFormData({ ...formData, address_en: e.target.value })}
                  placeholder="Address"
                />
              </div>
              <div className="space-y-2">
                <Label>Address (Arabic)</Label>
                <Input
                  value={formData.address_ar}
                  onChange={(e) => setFormData({ ...formData, address_ar: e.target.value })}
                  placeholder="العنوان"
                  dir="rtl"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
