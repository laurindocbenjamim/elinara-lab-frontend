import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthStatus } from '../types';

export const Layout: React.FC = () => {
  const { status } = useAuth();
  const location = useLocation();
  const isAuthenticated = status === AuthStatus.AUTHENTICATED;
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-200">
      <Navbar />
      <div className="flex flex-1">
        {isAuthenticated && !isAuthPage && <Sidebar />}
        <main className={`flex-grow ${(isAuthenticated && !isAuthPage) ? 'p-4 lg:p-8' : ''}`}>
          <div className={(isAuthenticated && !isAuthPage) ? 'max-w-7xl mx-auto' : ''}>
            <Outlet />
          </div>
        </main>
      </div>
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} ElinaraLab. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
