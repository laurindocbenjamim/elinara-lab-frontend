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
  const isStandalonePage = isHomePage;
  const isAppPage = isAuthenticated && !isAuthPage && !isStandalonePage;

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${(isAuthPage || isStandalonePage || isAppPage) ? 'bg-[#050505]' : 'bg-gray-50 dark:bg-gray-900'} ${isAppPage ? 'auth-app-shell' : ''}`}>
      {(!isStandalonePage && !isAuthPage) && <Navbar />}
      <div className="flex flex-1">
        {isAuthenticated && !isAuthPage && !isStandalonePage && <Sidebar />}
        <main className={`flex-grow ${isAppPage ? 'auth-app-main' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
