import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, LogOut, HardDrive, Settings, Bot, ListTodo, HelpCircle } from 'lucide-react';
import { AuthStatus } from '../types';

export const Navbar: React.FC = () => {
  const { user, status, logout } = useAuth();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex">
          <Link to="/" className="flex-shrink-0 flex items-center">
            <span className="font-bold text-lg tracking-tighter text-white hover:text-blue-400 transition-colors cursor-pointer uppercase">ELINARA LABS</span>
          </Link>
        </div>

        <div className="hidden lg:flex items-center">
          {status === AuthStatus.AUTHENTICATED && user && !isAuthPage ? (
            <div className="flex items-center gap-2 border-l border-white/10 pl-6 ml-6">
              <button className="p-2 text-zinc-400 hover:text-white transition-colors rounded-xl hover:bg-white/5" title="Help">
                <HelpCircle className="h-5 w-5" />
              </button>
              <button onClick={handleLogout} className="p-2 text-zinc-400 hover:text-red-400 transition-colors rounded-xl hover:bg-red-500/10" title="Sign out">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-6 text-sm font-mono">
              <Link to="/login" className="text-gray-500 hover:text-white transition-colors">Log in</Link>
              <Link to="/register" className="px-4 py-2 bg-white text-black font-bold rounded hover:bg-gray-200 transition-all">Sign up</Link>
            </div>
          )}
        </div>

        <div className="-mr-2 flex items-center lg:hidden gap-1">
          {status === AuthStatus.AUTHENTICATED && user && !isAuthPage && (
            <>
              <button className="p-2 text-zinc-400 hover:text-white transition-colors rounded-xl" title="Help">
                <HelpCircle className="h-5 w-5" />
              </button>
              <button onClick={handleLogout} className="p-2 text-zinc-400 hover:text-red-400 transition-colors rounded-xl" title="Sign out">
                <LogOut className="h-5 w-5" />
              </button>
            </>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-gray-400 hover:text-white transition-colors ml-1"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="lg:hidden bg-[#050505] border-b border-white/5 w-full max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="px-6 pt-4 pb-6 space-y-2">
            {status === AuthStatus.AUTHENTICATED && user ? (
              <div className="flex flex-col gap-2">
                <Link to="/agent" onClick={() => setIsOpen(false)} className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl transition-all">
                  <Bot className="h-5 w-5" />
                  <span className="font-medium">Agents</span>
                </Link>
                <Link to="/drive" onClick={() => setIsOpen(false)} className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl transition-all">
                  <HardDrive className="h-5 w-5" />
                  <span className="font-medium">Connections</span>
                </Link>
                <Link to="/agent-tasks" onClick={() => setIsOpen(false)} className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl transition-all">
                  <ListTodo className="h-5 w-5" />
                  <span className="font-medium">Reports</span>
                </Link>
                <Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl transition-all">
                  <Settings className="h-5 w-5" />
                  <span className="font-medium">Settings</span>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4 px-2">
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
