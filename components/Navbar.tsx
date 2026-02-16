import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Menu, X, LogOut, LayoutDashboard, Shield, HardDrive, Settings, Sun, Moon, Monitor, User as UserIcon, CreditCard } from 'lucide-react';
import { AuthStatus } from '../types';

export const Navbar: React.FC = () => {
  const { user, status, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isAppPage = status === AuthStatus.AUTHENTICATED && !isAuthPage;
  const isDarkChrome = isAuthPage || isAppPage;
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex">
          <Link to="/" className="flex-shrink-0 flex items-center">
            <span className="font-bold text-lg tracking-tighter text-white hover:text-blue-400 transition-colors cursor-pointer uppercase">ELINARA LABS</span>
          </Link>
        </div>

        <div className="hidden sm:items-center sm:flex">
          {status === AuthStatus.AUTHENTICATED && user && !isAuthPage ? null : (
            <div className="flex items-center space-x-6 text-sm font-mono">
              <Link to="/login" className="text-gray-500 hover:text-white transition-colors">Log in</Link>
              <Link to="/register" className="px-4 py-2 bg-white text-black font-bold rounded hover:bg-gray-200 transition-all">Sign up</Link>
            </div>
          )}
        </div>

        <div className="-mr-2 flex items-center sm:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="sm:hidden bg-[#050505] border-b border-white/5">
          <div className="px-4 pt-2 pb-6 space-y-4">
            {status === AuthStatus.AUTHENTICATED && user ? (
              <>
                <Link to="/dashboard" className="block text-gray-400 hover:text-white transition-colors py-2">Dashboard</Link>
                <Link to="/agent" className="block text-gray-400 hover:text-white transition-colors py-2">Agent</Link>
                <button onClick={handleLogout} className="block w-full text-left text-red-500 py-2">Sign out</button>
              </>
            ) : (
              <div className="flex flex-col gap-4">
                <Link to="/login" className="text-gray-400 hover:text-white py-2">Log in</Link>
                <Link to="/register" className="bg-white text-black text-center py-3 rounded font-bold">Sign up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
