import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';

export const Home: React.FC = () => {
  const navigate = useNavigate();

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
      </section>
    </main>
  );
};
