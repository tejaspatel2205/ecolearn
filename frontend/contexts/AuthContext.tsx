'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser, getCurrentUser, signIn, signOut as apiSignOut, signUp } from '@/lib/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: string, institutionId?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const profile = await getCurrentUser();
      setUser(profile);
    } catch (error) {
      // getCurrentUser already handles errors and returns null, so this shouldn't happen
      // But just in case, set user to null
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    try {
      const response = await signIn(email, password);
      if (response && response.user) {
        setUser(response.user);
      } else {
        throw new Error('Login failed: No user data received');
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw error; // Re-throw so the component can handle it
    }
  };

  const handleSignUp = async (email: string, password: string, fullName: string, role: string, institutionId?: string) => {
    try {
      const response = await signUp(email, password, fullName, role as any, institutionId);
      if (response && response.user) {
        setUser(response.user);
      } else {
        throw new Error('Registration failed: No user data received');
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw error; // Re-throw so the component can handle it
    }
  };

  const handleSignOut = async () => {
    await apiSignOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
