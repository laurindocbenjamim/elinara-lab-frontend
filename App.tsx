import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { GoogleDrive } from './pages/GoogleDrive';
import { OneDrive } from './pages/OneDrive';
import { FileProperties } from './pages/FileProperties';

import { CrossReference } from './pages/CrossReference';
import { AgentTasks } from './pages/AgentTasks';
import { Agent } from './pages/Agent';
import { AgentSettingsPage } from './pages/AgentSettingsPage';
import { AgentActions } from './pages/AgentActions';
import { Profile } from './pages/Profile';
import { Billing } from './pages/Billing';
import { SocketProvider } from './context/SocketContext';
import { AuthStatus } from './types';

// Protected Route Component
// FIX: Make children optional in type definition to satisfy strict TS checks
const ProtectedRoute = ({ children, requireAdmin = false }: { children?: React.ReactNode, requireAdmin?: boolean }) => {
  const { user, status } = useAuth();

  if (status === AuthStatus.LOADING || status === AuthStatus.IDLE) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (status === AuthStatus.UNAUTHENTICATED) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !user?.is_administrator) {
    return <div className="p-8 text-center text-red-600">Access Denied: Admin privileges required.</div>;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/login" replace />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        {/* Portfolio Routes removed */}

        {/* Protected Routes */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="agent/:processId?"
          element={
            <ProtectedRoute>
              <Agent />
            </ProtectedRoute>
          }
        />
        <Route
          path="agent/:processId/settings"
          element={
            <ProtectedRoute>
              <AgentSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="agent-tasks"
          element={
            <ProtectedRoute>
              <AgentTasks />
            </ProtectedRoute>
          }
        />
        <Route
          path="agent-actions"
          element={
            <ProtectedRoute>
              <AgentActions />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="billing"
          element={
            <ProtectedRoute>
              <Billing />
            </ProtectedRoute>
          }
        />
        <Route
          path="drive"
          element={
            <ProtectedRoute>
              <GoogleDrive />
            </ProtectedRoute>
          }
        />
        <Route
          path="drive/microsoft"
          element={
            <ProtectedRoute>
              <OneDrive />
            </ProtectedRoute>
          }
        />
        <Route
          path="drive/file/:id"
          element={
            <ProtectedRoute>
              <FileProperties />
            </ProtectedRoute>
          }
        />
        <Route
          path="drive/cross-reference"
          element={
            <ProtectedRoute>
              <CrossReference />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="admin"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Specific path for backend OAuth callback redirect - made public to avoid redirect loop before token is set */}
        <Route
          path="admin/user"
          element={<Dashboard />}
        />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <ThemeProvider>
          <SocketProvider>
            <AppRoutes />
          </SocketProvider>
        </ThemeProvider>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;