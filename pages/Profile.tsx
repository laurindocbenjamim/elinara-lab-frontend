import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';
import { User, AuthStatus } from '../types';
import { Save, Trash2, Mail, Phone, MapPin, User as UserIcon } from 'lucide-react';
import { DeleteAccountModal } from '../components/DeleteAccountModal';

export const Profile: React.FC = () => {
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
                                    {user?.username?.charAt(0).toUpperCase()}
                                </div>
                                <h4 className="text-xl font-bold text-gray-900 dark:text-white">{user?.firstname} {user?.lastname}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{user?.email}</p>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user?.is_administrator ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                    {user?.is_administrator ? 'Administrator' : 'Standard User'}
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
        </div>
    );
};
