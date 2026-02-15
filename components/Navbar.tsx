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
    <nav className="bg-white shadow-sm sticky top-0 z-50 transition-colors duration-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-primary-600 dark:text-primary-400">ElinaraLab</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
            </div>
          </div>

          <div className="hidden sm:ml-6 sm:items-center sm:flex">
            {status === AuthStatus.AUTHENTICATED && user && !isAuthPage ? (
              <div className="flex items-center space-x-4">
                {user.is_administrator && (
                  <Link to="/admin" className="text-gray-500 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 flex items-center gap-1 text-sm font-medium">
                    <Shield className="h-4 w-4" /> Admin
                  </Link>
                )}
                <Link to="/dashboard" className="text-gray-500 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 flex items-center gap-1 text-sm font-medium">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
                <Link to="/drive" className="text-gray-500 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 flex items-center gap-1 text-sm font-medium">
                  <HardDrive className="h-4 w-4" /> Cloud files
                </Link>

                <div className="h-8 w-px bg-gray-200 dark:bg-gray-600 mx-2"></div>

                {/* Settings Dropdown */}
                <div className="relative" ref={settingsRef}>
                  <button
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className="p-1 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 focus:outline-none"
                    title="Settings"
                  >
                    <Settings className="h-5 w-5" />
                  </button>

                  {isSettingsOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Theme
                      </div>
                      <button
                        onClick={() => { setTheme('light'); setIsSettingsOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${theme === 'light' ? 'bg-primary-50 text-primary-700 dark:bg-gray-700 dark:text-primary-400' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                      >
                        <Sun className="h-4 w-4" /> Light
                      </button>
                      <button
                        onClick={() => { setTheme('dark'); setIsSettingsOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${theme === 'dark' ? 'bg-primary-50 text-primary-700 dark:bg-gray-700 dark:text-primary-400' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                      >
                        <Moon className="h-4 w-4" /> Dark
                      </button>
                      <button
                        onClick={() => { setTheme('black'); setIsSettingsOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${theme === 'black' ? 'bg-primary-50 text-primary-700 dark:bg-gray-700 dark:text-primary-400' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                      >
                        <Monitor className="h-4 w-4" /> Black
                      </button>
                      <button
                        onClick={() => { setTheme('system'); setIsSettingsOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${theme === 'system' ? 'bg-primary-50 text-primary-700 dark:bg-gray-700 dark:text-primary-400' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                      >
                        <Monitor className="h-4 w-4" /> System
                      </button>
                    </div>
                  )}
                </div>

                <div className="h-8 w-px bg-gray-200 dark:bg-gray-600 mx-1"></div>

                {/* User Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {user.username?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 hidden md:block">{user.username}</span>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-xl py-2 ring-1 ring-black ring-opacity-5 animate-in fade-in zoom-in-95 duration-100 border border-gray-100 dark:border-gray-700 z-[60]">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 mb-2">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.firstname} {user.lastname}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <UserIcon className="h-4 w-4 text-gray-400" />
                        Profile Settings
                      </Link>

                      <Link
                        to="/billing"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <CreditCard className="h-4 w-4 text-gray-400" />
                        Billing & Plans
                      </Link>

                      <div className="my-2 border-t border-gray-100 dark:border-gray-700"></div>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Log in
                </Link>
                <Link to="/register" className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                  Sign up
                </Link>
              </div>
            )}
          </div>

          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
          </div>
          <div className="pt-4 pb-4 border-t border-gray-200">
            {status === AuthStatus.AUTHENTICATED && user && !isAuthPage ? (
              <div className="space-y-1">
                <div className="flex items-center px-4 mb-3">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                      {user.username?.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">{user.username}</div>
                    <div className="text-sm font-medium text-gray-500">{user.email}</div>
                  </div>
                </div>
                <Link to="/dashboard" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">Dashboard</Link>
                <Link to="/drive" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">Cloud files</Link>
                {user.is_administrator && (
                  <Link to="/admin" className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">Admin</Link>
                )}
                {/* Mobile Settings - simplified */}
                <div className="px-4 py-2">
                  <div className="text-base font-medium text-gray-500 mb-2">Theme</div>
                  <div className="flex gap-2">
                    <button onClick={() => setTheme('light')} className={`p-2 rounded ${theme === 'light' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100'}`}><Sun className="h-4 w-4" /></button>
                    <button onClick={() => setTheme('dark')} className={`p-2 rounded ${theme === 'dark' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100'}`}><Moon className="h-4 w-4" /></button>
                    <button onClick={() => setTheme('system')} className={`p-2 rounded ${theme === 'system' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100'}`}><Monitor className="h-4 w-4" /></button>
                  </div>
                </div>

                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-base font-medium text-red-600 hover:text-red-800 hover:bg-gray-100">Sign out</button>
              </div>
            ) : (
              <div className="space-y-1 px-2">
                <Link to="/login" className="block text-center w-full px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md">Log in</Link>
                <Link to="/register" className="block text-center w-full px-4 py-2 text-base font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md">Sign up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
