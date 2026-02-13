import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Play, Square, Pause } from 'lucide-react';
import { agentService, cloudFilesService } from '../services/api';
import { AgentStatus, AuthStatus } from '../types';
import '../styles/Dashboard.css';

export const Dashboard: React.FC = () => {
  const { user, status, logout } = useAuth();
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
      const [statusRes, filesRes] = await Promise.allSettled([
        agentService.getStatus(),
        cloudFilesService.listFiles()
      ]);

      if (statusRes.status === 'fulfilled') {
        setAgentStatus(statusRes.value);
      }

      if (filesRes.status === 'fulfilled') {
        setCloudFilesCount(filesRes.value.files.length);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAgentControl = async (action: 'start' | 'stop' | 'pause') => {
    try {
      const res = await agentService.control(action);
      setMessage({ type: 'success', text: res.msg });
      // Refresh status
      const statusRes = await agentService.getStatus();
      setAgentStatus(statusRes);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to control agent' });
    }
  };

  const activityLogs = useMemo(() => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const logs = [
      { time: now, msg: `Agent status: ${agentStatus?.agent_status || 'offline'}` },
      { time: now, msg: `Cloud files indexed: ${cloudFilesCount}` },
      { time: now, msg: `Current plan: ${agentStatus?.plan || 'Standard'}` }
    ];

    if (message) {
      logs.unshift({ time: now, msg: message.text });
    }

    return logs.slice(0, 6);
  }, [agentStatus?.agent_status, agentStatus?.plan, cloudFilesCount, message]);

  if (status === AuthStatus.LOADING || status === AuthStatus.IDLE || loading) {
    return (
      <div className="dashboard-page dashboard-loading">
        <div className="dashboard-glow" />
        <div className="dash-loader" />
        <p className="dash-loading-text">Loading overview...</p>
      </div>
    );
  }

  const displayName = user?.firstname || user?.username || 'User';
  const isAgentActive = agentStatus?.agent_status === 'active';

  return (
    <div className="dashboard-page">
      <div className="dashboard-glow" />

      <header className="dash-header">
        <div className="dash-branding-corner">
          <h1>Elinara Labs</h1>
        </div>

        <div className="dash-top-actions">
          <Link to="/profile" className="dash-logout-btn">Profile</Link>
          <button type="button" className="dash-logout-btn" onClick={logout}>Logout</button>
        </div>

        <div className="dash-branding">
          <p className="dash-subtitle">Workspace Control Center</p>
          <h2 className="company-dash-title">Welcome back, {displayName}</h2>
        </div>
      </header>

      {message && (
        <div className={`dash-inline-message ${message.type === 'success' ? 'is-success' : 'is-error'}`}>
          {message.text}
        </div>
      )}

      <section className="dash-grid">
        <article className="dash-card">
          <h3 className="section-title-centered">Your Account</h3>
          <div className="vault-field">
            <label className="vault-label" htmlFor="dash-username">Username</label>
            <input id="dash-username" className="vault-input" value={user?.username || ''} readOnly />
          </div>
          <div className="vault-field">
            <label className="vault-label" htmlFor="dash-email">Email</label>
            <input id="dash-email" className="vault-input" value={user?.email || ''} readOnly />
          </div>
          <div className="vault-field">
            <label className="vault-label" htmlFor="dash-role">Role</label>
            <input
              id="dash-role"
              className="vault-input"
              value={user?.is_administrator ? 'Administrator' : 'User'}
              readOnly
            />
          </div>
        </article>

        <article className="dash-card">
          <h3 className="section-title-centered">Workspace Snapshot</h3>
          <div className="agent-status-row">
            <div className="status-indicator">
              <span className={`status-dot ${isAgentActive ? '' : 'status-dot-offline'}`} />
              <span className="status-text">
                {isAgentActive ? 'Agent Active' : `Agent ${agentStatus?.agent_status || 'offline'}`}
              </span>
            </div>
          </div>
          <div className="dash-mini-metrics">
            <div className="dash-mini-metric">
              <span className="dash-mini-label">Cloud Files</span>
              <span className="dash-mini-value">{cloudFilesCount}</span>
            </div>
            <div className="dash-mini-metric">
              <span className="dash-mini-label">Plan</span>
              <span className="dash-mini-value">{agentStatus?.plan || 'Standard'}</span>
            </div>
          </div>
        </article>

        <article className="dash-card row-span-2">
          <h3 className="section-title-centered">Agent Controls</h3>
          <div className="dash-control-grid">
            <button type="button" className="dash-control-btn is-start" onClick={() => handleAgentControl('start')}>
              <Play className="dash-control-icon" />
              Start
            </button>
            <button type="button" className="dash-control-btn is-pause" onClick={() => handleAgentControl('pause')}>
              <Pause className="dash-control-icon" />
              Pause
            </button>
            <button type="button" className="dash-control-btn is-stop" onClick={() => handleAgentControl('stop')}>
              <Square className="dash-control-icon" />
              Stop
            </button>
          </div>

          <div className="logs-container">
            {activityLogs.map((entry, index) => (
              <div key={`${entry.time}-${index}`} className="log-entry">
                <span className="log-time">{entry.time}</span>
                <span className="log-msg">{entry.msg}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="dash-card col-span-2">
          <h3 className="section-title-centered">Quick Access</h3>
          <div className="dash-link-grid">
            <Link to="/agent" className="dash-link-card">Agent Config</Link>
            <Link to="/agent-tasks" className="dash-link-card">Agent Tasks</Link>
            <Link to="/drive" className="dash-link-card">Cloud Files</Link>
            <Link to="/billing" className="dash-link-card">Billing</Link>
          </div>
        </article>
      </section>
    </div>
  );
};
