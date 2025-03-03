//My first context snippet

// src/types/auth.types.ts
export interface User {
  id: string;
  name: string;
  email: string;
  isEmailVerified: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  googleLogin: (token: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
}

// src/context/AuthContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { tokenStorage } from '../services/tokenStorage';
import { authApi } from '../services/authApi';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ACCESS_TOKEN'; payload: string }
  | { type: 'LOGOUT' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ACCESS_TOKEN':
      return {
        ...state,
        accessToken: action.payload,
      };
    case 'LOGOUT':
      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        accessToken: null,
      };
    default:
      return state;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    accessToken: null,
  });

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await tokenStorage.getAccessToken();
        if (token) {
          const user = await authApi.getCurrentUser();
          dispatch({ type: 'SET_USER', payload: user });
          dispatch({ type: 'SET_ACCESS_TOKEN', payload: token });
        }
      } catch (error) {
        await tokenStorage.clearTokens();
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { accessToken, user } = await authApi.login(email, password);
      await tokenStorage.setTokens(accessToken);
      dispatch({ type: 'SET_USER', payload: user });
      dispatch({ type: 'SET_ACCESS_TOKEN', payload: accessToken });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const logout = async () => {
    await authApi.logout();
    await tokenStorage.clearTokens();
    dispatch({ type: 'LOGOUT' });
  };

  // ... implement other auth methods ...

  const value = {
    ...state,
    login,
    logout,
    // ... other methods
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

//My first indexDb services

// src/services/tokenStorage.ts
import { openDB } from 'idb';

const DB_NAME = 'auth-store';
const STORE_NAME = 'tokens';

class TokenStorage {
  private async getDB() {
    return openDB(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE_NAME);
      },
    });
  }

  async setTokens(accessToken: string) {
    const db = await this.getDB();
    await db.put(STORE_NAME, accessToken, 'accessToken');
  }

  async getAccessToken(): Promise<string | null> {
    const db = await this.getDB();
    return db.get(STORE_NAME, 'accessToken');
  }

  async clearTokens() {
    const db = await this.getDB();
    await db.clear(STORE_NAME);
  }
}

export const tokenStorage = new TokenStorage();

// src/services/authApi.ts
import axios from 'axios';
import { tokenStorage } from './tokenStorage';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { accessToken } = await api.post('/auth/refresh-token');
        await tokenStorage.setTokens(accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        await tokenStorage.clearTokens();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  async login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  async register(name: string, email: string, password: string) {
    const { data } = await api.post('/auth/register', { name, email, password });
    return data;
  },

  async getCurrentUser() {
    const { data } = await api.get('/user/me');
    return data.user;
  },

  async logout() {
    await api.post('/auth/logout');
  },

  // ... implement other API methods ...
};

// Authentication components

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const LoginPage = () => {
  const { login, isLoading } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      await login(data.email, data.password);
    } catch (error) {
      // Handle error
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">Sign in</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Input
              {...register('email')}
              type="email"
              placeholder="Email address"
              className="w-full"
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>
          <div>
            <Input
              {...register('password')}
              type="password"
              placeholder="Password"
              className="w-full"
            />
            {errors.password && (
              <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        <div className="text-center">
          <a href="/forgot-password" className="text-blue-600 hover:text-blue-800">
            Forgot password?
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerSchema } from '../validation/auth.schema';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const RegisterPage = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = React.useState('');
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data) => {
    try {
      await registerUser(data.name, data.email, data.password);
      navigate('/verify-email-notice');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="name" className="sr-only">Name</label>
              <Input
                id="name"
                type="text"
                {...register('name')}
                placeholder="Full name"
                className="w-full"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="Email address"
                className="w-full"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                placeholder="Password"
                className="w-full"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </Button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-6">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {/* Implement Google OAuth */}}
            >
              <img
                className="h-5 w-5 mr-2"
                src="/google-icon.svg"
                alt="Google logo"
              />
              Sign up with Google
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

//Email verification components

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export const EmailVerification = () => {
  const { token } = useParams();
  const { verifyEmail } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const verify = async () => {
      try {
        await verifyEmail(token!);
        setStatus('success');
        setTimeout(() => navigate('/login'), 3000);
      } catch (error) {
        setStatus('error');
      }
    };

    if (token) {
      verify();
    }
  }, [token, verifyEmail, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        {status === 'loading' && (
          <Alert>Verifying your email...</Alert>
        )}
        {status === 'success' && (
          <Alert variant="success">
            Email verified successfully! Redirecting to login...
          </Alert>
        )}
        {status === 'error' && (
          <Alert variant="destructive">
            Failed to verify email. The link may have expired.
            <Button
              onClick={() => navigate('/login')}
              className="mt-4 w-full"
            >
              Back to Login
            </Button>
          </Alert>
        )}
      </div>
    </div>
  );
};

export const UnverifiedEmail = () => {
  const { user, resendVerification } = useAuth();
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleResend = async () => {
    if (!user?.email) return;
    
    setStatus('sending');
    try {
      await resendVerification(user.email);
      setStatus('sent');
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <Alert variant="warning">
          Please verify your email address to continue.
          An email was sent to {user?.email}.
        </Alert>
        <Button
          onClick={handleResend}
          disabled={status === 'sending' || status === 'sent'}
          className="w-full"
        >
          {status === 'sending' ? 'Sending...' : 
           status === 'sent' ? 'Email Sent!' : 
           'Resend Verification Email'}
        </Button>
        {status === 'error' && (
          <Alert variant="destructive">
            Failed to send verification email. Please try again later.
          </Alert>
        )}
      </div>
    </div>
  );
};

// Shared validation Schemas


// src/validation/auth.schema.ts
import { z } from 'zod';

// Reuse the same schemas from backend
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
});

export const emailSchema = z.object({
  email: z.string().email('Invalid email address')
});
