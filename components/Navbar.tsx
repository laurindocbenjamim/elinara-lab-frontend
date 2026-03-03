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
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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

              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 p-1 pr-3 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all group"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-inner overflow-hidden">
                    {user?.firstname?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium text-white max-w-[120px] truncate group-hover:text-blue-400 transition-colors">
                    {user?.firstname || user?.username}
                  </span>
                </button>

                {isProfileOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsProfileOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0a0a0c]/95 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.8)] py-2 z-50 overflow-hidden transform opacity-100 scale-100 transition-all origin-top-right">
                      <div className="px-4 py-3 border-b border-white/10 mb-2">
                        <p className="text-sm font-bold text-white truncate">{user?.firstname} {user?.lastname}</p>
                        <p className="text-xs text-zinc-500 truncate">{user?.email || user?.username}</p>
                      </div>

                      <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
                        <Settings className="h-4 w-4" />
                        Account Settings
                      </Link>

                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          handleLogout();
                        }}
                        className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors mt-1"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
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
