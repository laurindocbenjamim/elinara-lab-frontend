import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';
import { User, AuthStatus } from '../types';
import { Save, Trash2, Mail, Phone, MapPin, User as UserIcon } from 'lucide-react';

import { DeleteAccountModal } from '../components/DeleteAccountModal';

export const Dashboard: React.FC = () => {
  const { user, status, logout, checkAuth } = useAuth();
  const [formData, setFormData] = useState<Partial<User>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(user);
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setLoading(true);
    setMessage(null);
    try {
      await userService.updateUser(user.id, formData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      await checkAuth(); // Refresh user data
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!user?.id) return;
    try {
      await userService.deleteUser(user.id);
      setIsDeleteModalOpen(false);
      logout();
    } catch (error: any) {
      setIsDeleteModalOpen(false);
      setMessage({ type: 'error', text: error.message || 'Failed to delete account' });
    }
  };

  if (status === AuthStatus.LOADING || status === AuthStatus.IDLE) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] dark:text-white">
        <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400 font-medium">Loading profile...</p>
      </div>
    );
  }

  if (!user || status === AuthStatus.UNAUTHENTICATED) {
    return (
      <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-white rounded-2xl shadow-xl p-12 border border-gray-100 max-w-2xl mx-auto">
          <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <UserIcon className="h-8 w-8 text-primary-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Public Profile View</h2>
          <p className="text-gray-600 mb-8 text-lg">
            This page is usually reserved for logged-in users.
            If you are trying to access your profile, please sign in below.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#/login"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-primary-600 hover:bg-primary-700 transition-all shadow-lg hover:shadow-primary-500/30"
            >
              Log In
            </a>
            <a
              href="#/elinara"
              className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all shadow-sm"
            >
              Visit Elinara
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 dark:text-gray-100">
      <div className="md:grid md:grid-cols-3 md:gap-6">

        {/* Profile Summary */}
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Profile Information</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Update your personal details and account settings.
            </p>

            <div className="mt-6 bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="px-4 py-5 sm:p-6 flex flex-col items-center text-center">
                <div className="h-24 w-24 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 text-3xl font-bold mb-4">
                  {user.username?.charAt(0).toUpperCase()}
                </div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white">{user.firstname} {user.lastname}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{user.email}</p>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'admin' || user.is_administrator ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                  {user.is_administrator ? 'Administrator' : 'Standard User'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="mt-5 md:mt-0 md:col-span-2">

          {message && (
            <div className={`mb-4 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="shadow sm:rounded-md sm:overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="px-4 py-5 bg-white dark:bg-gray-800 sm:p-6 space-y-6">

              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="firstname" className="block text-sm font-medium text-gray-700 dark:text-gray-300">First name</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="firstname"
                      id="firstname"
                      value={formData.firstname || ''}
                      onChange={handleChange}
                      className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 rounded-md py-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="lastname" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last name</label>
                  <input
                    type="text"
                    name="lastname"
                    id="lastname"
                    value={formData.lastname || ''}
                    onChange={handleChange}
                    className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md py-2 border px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>

                <div className="col-span-6 sm:col-span-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email || ''}
                      onChange={handleChange}
                      className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 rounded-md py-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Country</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="country"
                      id="country"
                      value={formData.country || ''}
                      onChange={handleChange}
                      className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 rounded-md py-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="phone"
                      id="phone"
                      value={formData.phone || ''}
                      onChange={handleChange}
                      className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 rounded-md py-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                </div>

                <div className="col-span-6">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Street address</label>
                  <input
                    type="text"
                    name="address"
                    id="address"
                    value={formData.address || ''}
                    onChange={handleChange}
                    className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md py-2 border px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
              </div>
            </div>
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 text-right sm:px-6 flex justify-between items-center border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loading ? 'Saving...' : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Account Modal */}
      {user && (
        <DeleteAccountModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          userData={user}
        />
      )}

      {/* Connected Accounts Section */}
      <div className="mt-8 bg-white dark:bg-gray-800 shadow sm:rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Connected Accounts</h3>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            <p>Manage your connections to third-party cloud providers.</p>
          </div>
          <div className="mt-5 space-y-4">
            {/* Google Drive */}
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .533 5.333.533 12S5.867 24 12.48 24c3.44 0 6.013-1.147 8.027-3.24 2.053-2.053 2.72-5.133 2.72-7.68 0-.533-.053-1.093-.147-1.613h-10.6z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">Google Drive</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user?.providers?.google?.connected
                      ? `Connected as ${user.providers.google.email}`
                      : 'Not connected'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (user?.providers?.google?.connected) {
                    if (confirm('Are you sure you want to disconnect Google Drive?')) {
                      // Disconnect logic (call API)
                      import('../services/api').then(({ authService }) => { // Dynamic import to avoid circular dependency issues if any, or just use global
                        authService.disconnectProvider('google').then(() => {
                          checkAuth(); // Refresh state
                          setMessage({ type: 'success', text: 'Google Drive disconnected successfully' });
                        }).catch(err => setMessage({ type: 'error', text: err.message || 'Failed to disconnect' }));
                      });
                    }
                  } else {
                    import('../services/api').then(({ authService }) => {
                      authService.googleLogin();
                    });
                  }
                }}
                className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${user?.providers?.google?.connected
                  ? 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-primary-500'
                  : 'border-transparent text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-500'
                  }`}
              >
                {user?.providers?.google?.connected ? 'Disconnect' : 'Connect'}
              </button>
            </div>

            {/* Microsoft OneDrive */}
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M0 0h24v24H0z" fill="none" />
                    <path d="M11.55 21H3v-8.55h8.55V21zM21 21h-8.55v-8.55H21V21zM11.55 11.55H3V3h8.55v8.55zM21 11.55h-8.55V3H21v8.55z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">Microsoft OneDrive</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user?.providers?.microsoft?.connected
                      ? `Connected as ${user.providers.microsoft.email}`
                      : 'Not connected'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (user?.providers?.microsoft?.connected) {
                    if (confirm('Are you sure you want to disconnect OneDrive?')) {
                      import('../services/api').then(({ authService }) => {
                        authService.disconnectProvider('microsoft').then(() => {
                          checkAuth();
                          setMessage({ type: 'success', text: 'OneDrive disconnected successfully' });
                        }).catch(err => setMessage({ type: 'error', text: err.message || 'Failed to disconnect' }));
                      });
                    }
                  } else {
                    import('../services/api').then(({ authService }) => {
                      authService.microsoftLogin();
                    });
                  }
                }}
                className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${user?.providers?.microsoft?.connected
                  ? 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-primary-500'
                  : 'border-transparent text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-500'
                  }`}
              >
                {user?.providers?.microsoft?.connected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
