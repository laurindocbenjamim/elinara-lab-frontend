import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthStatus } from '../types';
import '../styles/AuthAppTheme.css';

export const Layout: React.FC = () => {
  const { status } = useAuth();
  const location = useLocation();
  const isAuthenticated = status === AuthStatus.AUTHENTICATED;
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isHomePage = location.pathname === '/';
  const isDashboardPage = location.pathname === '/dashboard';
  const isStandalonePage = isHomePage || isDashboardPage;
  const isAppPage = isAuthenticated && !isAuthPage && !isStandalonePage;

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${(isAuthPage || isStandalonePage || isAppPage) ? 'bg-[#050505]' : 'bg-gray-50 dark:bg-gray-900'} ${isAppPage ? 'auth-app-shell' : ''}`}>
      {(!isStandalonePage && !isAuthPage) && <Navbar />}
      <div className="flex flex-1">
        {isAuthenticated && !isAuthPage && !isStandalonePage && <Sidebar />}
        <main className={`flex-grow ${(isAuthenticated && !isAuthPage && !isStandalonePage) ? 'p-4 lg:p-8' : ''} ${isAppPage ? 'auth-app-main' : ''}`}>
          <div className={(isAuthenticated && !isAuthPage && !isStandalonePage) ? 'max-w-7xl mx-auto' : ''}>
            <Outlet />
          </div>
        </main>
      </div>
      {(!isAuthPage && !isStandalonePage) && (
        <footer className={`${isAppPage ? 'bg-[rgba(10,10,12,0.8)] border-t border-white/10 text-zinc-400' : 'bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700'} mt-auto py-6`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className={`text-center text-sm ${isAppPage ? 'text-zinc-500' : 'text-gray-500 dark:text-gray-400'}`}>
              &copy; {new Date().getFullYear()} ElinaraLab. All rights reserved.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
};
