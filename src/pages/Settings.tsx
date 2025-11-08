import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
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
    
    // Get the first company settings record (shared across all users)
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setFormData({
        company_name_en: data.company_name_en || '',
        company_name_ar: data.company_name_ar || '',
        phone: data.phone || '',
        vat_id: data.vat_id || '',
        address_en: data.address_en || '',
        address_ar: data.address_ar || '',
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Get the first company settings record (shared across all users)
    const { data: existing } = await supabase
      .from('company_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    let error;
    if (existing) {
      // Update the existing shared settings
      const result = await supabase
        .from('company_settings')
        .update(formData)
        .eq('id', existing.id);
      error = result.error;
    } else {
      // Create new shared settings (use the current user's ID for the first record)
      const result = await supabase
        .from('company_settings')
        .insert([{ ...formData, user_id: user.id }]);
      error = result.error;
    }

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Settings saved successfully' });
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
