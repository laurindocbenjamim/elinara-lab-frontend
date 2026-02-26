import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, AuthStatus } from '../types';
import { userService, authService } from '../services/api';

interface AuthContextType {
  user: User | null;
  status: AuthStatus;
  logout: () => void;
  checkAuth: () => Promise<void>;
  login: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>(AuthStatus.IDLE);

  const checkAuth = async () => {
    // Only set loading state if we're not potentially already authenticated
    // This prevents UI flashing/unmounting during background refreshes
    if (status === AuthStatus.IDLE || status === AuthStatus.UNAUTHENTICATED) {
      setStatus(AuthStatus.LOADING);
    }

    try {
      const response = await userService.getCurrentUser();

      if (response && response.user) {
        setUser(response.user);
        setStatus(AuthStatus.AUTHENTICATED);
      } else {
        throw new Error('User data missing');
      }
    } catch (error) {
      setUser(null);
      setStatus(AuthStatus.UNAUTHENTICATED);
    }
  };

  const login = async () => {
    await checkAuth();
  };

  const logout = async () => {
    // Clear local state immediately for better UX
    setUser(null);
    setStatus(AuthStatus.UNAUTHENTICATED);

    try {
      await authService.logout();
    } catch (e) {
      // Silent fail - we already cleared the local state
    }

    // Using the specific location format recommended by the backend team
    // for hash-based routing redirects.
    window.location.href = '/#/login';
  };

  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (status === AuthStatus.AUTHENTICATED) {
      const returnUrl = sessionStorage.getItem('auth_return_url');
      if (returnUrl) {
        sessionStorage.removeItem('auth_return_url');
        navigate(returnUrl);
      }
    }
  }, [status, navigate]);

  return (
    <AuthContext.Provider value={{ user, status, logout, checkAuth, login }}>
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
