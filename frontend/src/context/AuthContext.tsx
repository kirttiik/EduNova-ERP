"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/lib/api';

/**
 * Authentication Context
 * 
 * Manages user authentication state across the application.
 * Stores JWT token in localStorage and provides login/logout functions.
 */

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'school_coordinator';
  schoolId?: string;
  schoolName?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing token on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('edunova_token');
      const storedUser = localStorage.getItem('edunova_user');
      
      const isValid = storedToken && storedUser && storedUser !== 'null' && storedUser !== 'undefined';
      
      if (isValid) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } else {
        localStorage.removeItem('edunova_token');
        localStorage.removeItem('edunova_user');
      }
    } catch (e) {
      // If parsing fails, clear the invalid state
      localStorage.removeItem('edunova_token');
      localStorage.removeItem('edunova_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authApi.login(email, password);
      
      if (response.success && response.data) {
        const { token: newToken, user: userData } = response.data;
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('edunova_token', newToken);
        localStorage.setItem('edunova_user', JSON.stringify(userData));
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('edunova_token');
    localStorage.removeItem('edunova_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        error,
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
