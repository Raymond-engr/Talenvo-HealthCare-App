import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { api } from '../services/api.config';
import { tokenStorage } from '../services/tokenStorage';

// Types
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

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Action types
type AuthAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ACCESS_TOKEN'; payload: string }
  | { type: 'LOGOUT' };

// Reducer
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

// Provider
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
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
          // Set token in state
          dispatch({ type: 'SET_ACCESS_TOKEN', payload: token });
          
          // Fetch current user
          const { data } = await api.get('/user/me');
          if (data && data.user) {
            dispatch({ type: 'SET_USER', payload: data.user });
          }
        }
      } catch (error) {
        console.error('Authentication initialization error:', error);
        await tokenStorage.clearTokens();
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initAuth();
  }, []);

  // Auth methods
  const login = async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const { accessToken, user } = data;
      
      await tokenStorage.setTokens(accessToken);
      dispatch({ type: 'SET_ACCESS_TOKEN', payload: accessToken });
      dispatch({ type: 'SET_USER', payload: user });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const register = async (name: string, email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await api.post('/auth/register', { name, email, password });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await tokenStorage.clearTokens();
      dispatch({ type: 'LOGOUT' });
    }
  };

  const googleLogin = async (token: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data } = await api.post('/auth/google', { token });
      const { accessToken, user } = data;
      
      await tokenStorage.setTokens(accessToken);
      dispatch({ type: 'SET_ACCESS_TOKEN', payload: accessToken });
      dispatch({ type: 'SET_USER', payload: user });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const verifyEmail = async (token: string) => {
    try {
      await api.get(`/auth/verify-email/${token}`);
      // If the user is already logged in, update their status
      if (state.user) {
        const updatedUser = {...state.user, isEmailVerified: true};
        dispatch({ type: 'SET_USER', payload: updatedUser });
      }
    } catch (error) {
      throw error;
    }
  };

  const resendVerification = async (email: string) => {
    try {
      await api.post('/auth/resend-verification', { email });
    } catch (error) {
      throw error;
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await api.post('/auth/forgot-password', { email });
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    googleLogin,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};