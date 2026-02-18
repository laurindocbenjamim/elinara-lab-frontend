import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, AuthStatus } from '../types';
import { userService, authService } from '../services/api';

interface AuthContextType {
  user: User | null;
  status: AuthStatus;
  logout: () => void;
  checkAuth: () => Promise<void>;
  login: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const DEV_SESSION_ROLE_KEY = 'dev_session_role';

const isDevSessionRole = (role: string | null): role is 'user' | 'admin' =>
  role === 'user' || role === 'admin';

const buildDevUser = (role: 'user' | 'admin'): User => ({
  id: role === 'admin' ? 999 : 998,
  email: role === 'admin' ? 'admin@elinara.local' : 'user@elinara.local',
  username: role === 'admin' ? 'dev_admin' : 'dev_user',
  firstname: 'Dev',
  lastname: role === 'admin' ? 'Admin' : 'User',
  role,
  is_administrator: role === 'admin',
  has_drive_access: true,
  has_microsoft_drive_access: true,
  providers: {
    google: { connected: true, email: role === 'admin' ? 'admin@elinara.local' : 'user@elinara.local' },
    microsoft: { connected: true, email: role === 'admin' ? 'admin@elinara.local' : 'user@elinara.local' }
  }
});

export const AuthProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>(AuthStatus.IDLE);

  const checkAuth = async () => {
    if (import.meta.env.DEV) {
      const devRole = localStorage.getItem(DEV_SESSION_ROLE_KEY);
      if (isDevSessionRole(devRole)) {
        setUser(buildDevUser(devRole));
        setStatus(AuthStatus.AUTHENTICATED);
        return;
      }
    }

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

  const login = async (token: string) => {
    if (token) {
      localStorage.setItem('token', token);
    }
    await checkAuth();
  };

  const logout = async () => {
    // Clear local state immediately for better UX
    localStorage.removeItem('token');
    localStorage.removeItem(DEV_SESSION_ROLE_KEY);
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
