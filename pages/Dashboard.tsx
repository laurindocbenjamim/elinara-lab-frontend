import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BrainCircuit, HardDrive, CreditCard, Play, Square, ArrowUpRight, Activity, Loader2 } from 'lucide-react';
import { agentService, cloudFilesService } from '../services/api';
import { AgentStatus, AuthStatus } from '../types';

export const Dashboard: React.FC = () => {
  const { user, status } = useAuth();
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [cloudFilesCount, setCloudFilesCount] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statusRes, filesRes] = await Promise.all([
        agentService.getStatus(),
        cloudFilesService.listFiles()
      ]);
      setAgentStatus(statusRes);
      setCloudFilesCount(filesRes.files.length);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAgentControl = async (action: 'start' | 'stop' | 'pause') => {
    try {
      const res = await agentService.control(
        action,
        user?.id,
        agentStatus?.id || undefined
      );
      setMessage({ type: 'success', text: res.msg });
      // Refresh status
      const statusRes = await agentService.getStatus();
      setAgentStatus(statusRes);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to control agent' });
    }
  };

  if (status === AuthStatus.LOADING || status === AuthStatus.IDLE || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] dark:text-white">
        <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400 font-medium">Loading overview...</p>
      </div>
    );
  }

  const stats = [
    {
      name: 'Agent Status',
      value: agentStatus?.agent_status || 'Offline',
      icon: BrainCircuit,
      color: agentStatus?.agent_status === 'active' ? 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' : 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400',
      link: '/#/agent',
      linkText: 'Configure Agent'
    },
    {
      name: 'Cloud Files',
      value: cloudFilesCount.toString(),
      icon: HardDrive,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
      link: '/#/drive',
      linkText: 'Manage Files'
    },
    {
      name: 'Current Plan',
      value: agentStatus?.plan || 'Standard',
      icon: CreditCard,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400',
      link: '/#/billing',
      linkText: 'Upgrade Plan'
    }
  ];

  return (
    <div className="py-6">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Welcome back, {user?.firstname || user?.username}!</h2>
        <p className="text-gray-500 dark:text-gray-400">Here's what's happening with your workspace today.</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-2xl border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <a href={stat.link} className="text-gray-400 hover:text-primary-600 transition-colors">
                <ArrowUpRight className="h-5 w-5" />
              </a>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{stat.name}</p>
              <h4 className="text-2xl font-black text-gray-900 dark:text-white capitalize">{stat.value}</h4>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700/50">
              <a href={stat.link} className="text-xs font-bold text-primary-600 hover:text-primary-700 uppercase tracking-widest">
                {stat.linkText}
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Quick Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Quick Controls</h3>
            <a href="/#/agent" className="text-sm font-bold text-primary-600 flex items-center gap-1">
              Full Config <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleAgentControl('start')}
              className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-transparent transition-all group ${agentStatus?.agent_status === 'active' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-900/50 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-200 dark:hover:border-green-800'}`}
            >
              {agentStatus?.agent_status === 'active' ? (
                <Loader2 className="h-8 w-8 text-green-500 mb-2 animate-spin" />
              ) : (
                <Play className="h-8 w-8 text-gray-400 group-hover:text-green-500 mb-2" />
              )}
              <span className={`text-xs font-bold ${agentStatus?.agent_status === 'active' ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                {agentStatus?.agent_status === 'active' ? 'Running' : 'Start'}
              </span>
            </button>
            <button
              onClick={() => handleAgentControl('stop')}
              className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-transparent bg-gray-50 dark:bg-gray-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800 transition-all group"
            >
              <Square className="h-8 w-8 text-gray-400 group-hover:text-red-500 mb-2" />
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400 group-hover:text-red-700 dark:group-hover:text-red-400">Stop</span>
            </button>
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recent Activity</h3>
            <a href="/#/agent-tasks" className="text-sm font-bold text-primary-600 flex items-center gap-1">
              All Tasks <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>

          <div className="flex-grow flex flex-col items-center justify-center py-8 text-center">
            <div className="h-20 w-20 bg-gray-50 dark:bg-gray-900/50 rounded-full flex items-center justify-center mb-4 border border-gray-100 dark:border-gray-700">
              <Activity className="h-10 w-10 text-gray-300" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No recent agent activity found.</p>
            <button className="mt-4 text-xs font-black uppercase tracking-widest text-primary-600 hover:text-primary-700">
              Trigger New Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
