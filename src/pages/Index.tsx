import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Package2 } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Handle redirect from email confirmation if user landed on localhost
    // but should be on production domain
    const hash = window.location.hash;
    const productionUrl = 'https://gleaming-hummingbird-6934de.netlify.app';
    
    if (hash && hash.includes('access_token') && productionUrl && window.location.origin.includes('localhost')) {
      // User is on localhost but has auth token - redirect to production
      const redirectUrl = `${productionUrl}${window.location.pathname}${hash}`;
      console.log('[Index] Redirecting to production:', redirectUrl);
      window.location.href = redirectUrl;
      return;
    }

    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5">
      <div className="text-center max-w-2xl px-4">
        <div className="flex justify-center mb-6">
        <img src="/images/logo.png" alt="logo" className="w-48 h-48 rounded-full" />
        
        </div>
        <h1 className="mb-4 text-4xl md:text-5xl font-bold text-foreground">
        مؤسسة وثبة العز 
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
        لقطع غيار التكييف والتبريد
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => navigate('/auth')}>
            Get Started
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
