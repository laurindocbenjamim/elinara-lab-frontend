import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Home.css';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const isDevMode = import.meta.env.DEV;

  const handleDevAccess = async (role: 'user' | 'admin') => {
    localStorage.setItem('dev_session_role', role);
    await checkAuth();
    navigate('/agent');
  };

  return (
    <main className="home-page">
      <div className="bg-radial-glow" />
      <div className="bg-noise" />

      <section className="home-hero">
        <h1 className="hero-title">Elinara Labs</h1>

        <button
          type="button"
          className="future-btn"
          onClick={() => navigate('/login')}
        >
          TOUCH THE FUTURE
        </button>

        {isDevMode && (
          <div className="dev-access">
            <p className="dev-access__label">DEV MODE</p>
            <div className="dev-access__actions">
              <button type="button" className="dev-btn" onClick={() => handleDevAccess('user')}>
                Entrar como User
              </button>
              <button type="button" className="dev-btn" onClick={() => handleDevAccess('admin')}>
                Entrar como Admin
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
};
