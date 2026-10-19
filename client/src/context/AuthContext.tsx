import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setAccessToken } from '../services/api';
import { User } from '../types/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  registerUser: (data: any) => Promise<any>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<User>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Attempt session restoration via refresh token / cookie
    const initAuth = async () => {
      try {
        const refreshRes = await api.post('/auth/refresh');
        if (refreshRes.data.data?.accessToken) {
          setAccessToken(refreshRes.data.data.accessToken);
          await refreshUser();
        } else {
          setLoading(false);
        }
      } catch {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.post('/auth/login', { email, password });
    const { accessToken, user: loggedUser } = res.data.data;
    setAccessToken(accessToken);
    setUser(loggedUser);
    return loggedUser;
  };

  const registerUser = async (data: any) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout API error
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const updateUserProfile = async (data: Partial<User>): Promise<User> => {
    const res = await api.put('/auth/profile', data);
    const updatedUser = res.data.data.user;
    setUser((prev) => (prev ? { ...prev, ...updatedUser } : updatedUser));
    return updatedUser;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        registerUser,
        logout,
        updateUserProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

