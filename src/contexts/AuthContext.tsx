import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiPost } from '@/lib/api';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (username: string, email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'auth_user';
const TOKEN_KEY = 'auth_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem(STORAGE_KEY);
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        }
      } catch (error) {
        console.error('[Auth] Error loading user from storage:', error);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(TOKEN_KEY);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await apiPost<{ user: User; token: string; message: string }>('/api/auth/login', {
        email,
        password,
      });
      
      // Store user and token in localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(response.user));
      localStorage.setItem(TOKEN_KEY, response.token);
      
      setUser(response.user);
      
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      
      return { error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return { error: { message: errorMessage } };
    }
  };

  const signUp = async (username: string, email: string, password: string) => {
    try {
      const response = await apiPost<{ user: User; message: string }>('/api/auth/register', {
        username,
        email,
        password,
      });
      
      toast({
        title: "Success",
        description: "Account created successfully. Please login.",
      });
      
      return { error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return { error: { message: errorMessage } };
    }
  };

  const signOut = async () => {
    // Clear localStorage
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    
    // Clear user state
    setUser(null);
    
    toast({
      title: "Signed out successfully",
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
