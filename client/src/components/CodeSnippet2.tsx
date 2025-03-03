// security configurations

// src/services/api.config.ts
import axios from 'axios';
import { tokenStorage } from './tokenStorage';
import { logger } from '../utils/logger';

// Create axios instance with security configurations
export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  // Timeout after 10 seconds
  timeout: 10000
});

// Request interceptor with security headers and logging
api.interceptors.request.use(async (config) => {
  // Add auth token
  const token = await tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Add CSRF token if available
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }

  // Log request (exclude sensitive data)
  logger.info('API Request', {
    url: config.url,
    method: config.method,
    timestamp: new Date().toISOString()
  });

  return config;
}, error => {
  logger.error('API Request Error', error);
  return Promise.reject(error);
});

// Response interceptor with error handling and token refresh
api.interceptors.response.use(
  response => {
    logger.info('API Response', {
      url: response.config.url,
      status: response.status,
      timestamp: new Date().toISOString()
    });
    return response;
  },
  async error => {
    logger.error('API Response Error', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      timestamp: new Date().toISOString()
    });

    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await api.post('/auth/refresh-token');
        await tokenStorage.setTokens(data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        await tokenStorage.clearTokens();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);


// My second context and indexDB snippet 

// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { openDB, IDBPDatabase } from 'idb';

interface User {
  id: string;
  name: string;
  email: string;
  isEmailVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (token: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Token management with IndexedDB
class TokenStorage {
  private db: IDBPDatabase | null = null;
  private readonly DB_NAME = 'auth-storage';
  private readonly STORE_NAME = 'tokens';

  async init() {
    this.db = await openDB(this.DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore('tokens');
      },
    });
  }

  async setAccessToken(token: string) {
    await this.db?.put(this.STORE_NAME, token, 'accessToken');
  }

  async getAccessToken(): Promise<string | undefined> {
    return this.db?.get(this.STORE_NAME, 'accessToken');
  }

  async removeTokens() {
    await this.db?.delete(this.STORE_NAME, 'accessToken');
  }
}

// Initialize axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true, // Important for cookies
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const tokenStorage = new TokenStorage();

  useEffect(() => {
    const initialize = async () => {
      await tokenStorage.init();
      const token = await tokenStorage.getAccessToken();
      
      if (token) {
        try {
          const response = await api.get('/user/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(response.data.data);
        } catch (error) {
          await tokenStorage.removeTokens();
        }
      }
      
      setLoading(false);
    };

    initialize();
  }, []);

  // Axios interceptor for token handling
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      async (config) => {
        const token = await tokenStorage.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const response = await api.post('/auth/refresh-token');
            const { accessToken } = response.data;
            
            await tokenStorage.setAccessToken(accessToken);
            
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          } catch (refreshError) {
            await tokenStorage.removeTokens();
            setUser(null);
            throw refreshError;
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const authContext: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    
    login: async (email: string, password: string) => {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, user: userData } = response.data;
      
      await tokenStorage.setAccessToken(accessToken);
      setUser(userData);
    },

    loginWithGoogle: async (token: string) => {
      const response = await api.post('/auth/google', { token });
      const { accessToken, user: userData } = response.data;
      
      await tokenStorage.setAccessToken(accessToken);
      setUser(userData);
    },

    register: async (name: string, email: string, password: string) => {
      await api.post('/auth/register', { name, email, password });
    },

    logout: async () => {
      await api.post('/auth/logout');
      await tokenStorage.removeTokens();
      setUser(null);
    },

    resendVerification: async (email: string) => {
      await api.post('/auth/resend-verification', { email });
    },

    forgotPassword: async (email: string) => {
      await api.post('/auth/forgot-password', { email });
    },

    resetPassword: async (token: string, password: string) => {
      await api.post(`/auth/reset-password/${token}`, { password });
    }
  };

  return (
    <AuthContext.Provider value={authContext}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Authentication pages


// src/pages/auth/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        navigate('/verify-email-notice', { state: { email } });
      } else {
        setError(err.response?.data?.message || 'Failed to login');
      }
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        await loginWithGoogle(response.access_token);
        navigate('/dashboard');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to login with Google');
      }
    }
  });

  return (
    // Login Page component
)

// src/pages/auth/RegisterPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await register(name, email, password);
      navigate('/verify-email-notice', { state: { email } });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register');
    }
  };

  return (
    // Register Page Component
    )