import React from 'react';
import { CreditCard, Check, Zap, Shield, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Billing: React.FC = () => {
    const { user } = useAuth();

    const plans = [
        {
            name: 'Starter',
            price: '$0',
            description: 'Perfect for small projects and solo experimenters.',
            features: ['Up to 100 tasks/month', 'Basic Support', '1 Team Member', 'Standard AI Model'],
            current: false,
        },
        {
            name: 'Pro',
            price: '$49',
            description: 'The best for growing businesses and professionals.',
            features: ['Unlimited tasks', 'Priority Support', '5 Team Members', 'Advanced AI Models', 'API Access'],
            current: true,
        },
        {
            name: 'Enterprise',
            price: 'Custom',
            description: 'Advanced features for large-scale operations.',
            features: ['Custom AI Solutions', 'Dedicated Account Manager', 'Unlimited Team Members', 'SLA Guarantee'],
            current: false,
        },
    ];

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 dark:text-gray-100">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Billing & Subscription</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Manage your plan, invoices, and payment methods.
                </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 mb-12">
                {plans.map((plan) => (
                    <div
                        key={plan.name}
                        className={`relative bg-white dark:bg-gray-800 rounded-3xl p-8 border ${plan.current
                                ? 'border-primary-500 shadow-2xl shadow-primary-500/20'
                                : 'border-gray-200 dark:border-gray-700'
                            } transition-all duration-300 hover:scale-[1.02]`}
                    >
                        {plan.current && (
                            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-[-20%] bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                                Current Plan
                            </div>
                        )}
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-gray-900 dark:text-white">{plan.price}</span>
                                {plan.price !== 'Custom' && <span className="text-gray-500 dark:text-gray-400 text-sm">/month</span>}
                            </div>
                            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{plan.description}</p>
                        </div>
                        <ul className="space-y-4 mb-8">
                            {plan.features.map((feature) => (
                                <li key={feature} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                                    <div className="bg-primary-100 dark:bg-primary-900/30 p-1 rounded-full">
                                        <Check className="h-3 w-3 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                        <button
                            className={`w-full py-4 rounded-2xl font-bold transition-all ${plan.current
                                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                                    : 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/30'
                                }`}
                            disabled={plan.current}
                        >
                            {plan.current ? 'Current Subscription' : 'Upgrade Now'}
                        </button>
                    </div>
                ))}
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary-500" />
                        Payment Method
                    </h3>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-16 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700 font-black text-sm text-blue-800 italic">
                                VISA
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">Visa ending in 4242</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Expires 12/26</p>
                            </div>
                        </div>
                        <button className="text-sm font-bold text-primary-600 hover:text-primary-700">Edit</button>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <Zap className="h-5 w-5 text-primary-500" />
                        Active Subscription
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Status</span>
                            <span className="font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                                <Shield className="h-3 w-3" /> Active
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Next billing date</span>
                            <span className="font-bold text-gray-900 dark:text-white">March 13, 2026</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Amount</span>
                            <span className="font-bold text-gray-900 dark:text-white">$49.00</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-12 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
                    <HelpCircle className="h-4 w-4" />
                    Need help with your subscription? <a href="#" className="underline font-bold text-primary-600">Contact Support</a>
                </p>
            </div>
        </div>
    );
};
