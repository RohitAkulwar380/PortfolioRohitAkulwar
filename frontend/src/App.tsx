/*
 * App.tsx
 * ────────
 * Updated to randomly select between IntroOverlay and StripedIntro
 */

import { useEffect, useState, useMemo } from 'react';
import type { ResumeData } from './types';
import SplitLayout from './components/layout/SplitLayout';
import IntroOverlay from './components/layout/IntroOverlay';
import StripedIntro from './components/layout/StripedIntro'; // Import the new component
import './styles/globals.css';

/* Base API URL from .env */
const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function App() {
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [introFinished, setIntroFinished] = useState(false);

  // Randomly select animation variant once on mount. 
  // 'glitch' = Original Spider-verse style
  // 'stripes' = New Retro Stack style
  const animationVariant = useMemo(() => {
    return Math.random() > 0.5 ? 'glitch' : 'stripes';
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/resume`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<ResumeData>;
      })
      .then((data) => {
        setResume(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        console.error('Failed to load resume:', err.message);
        setError('Could not load portfolio data. Is the backend running?');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (resume) {
      setTimeout(() => {
        document.querySelectorAll('.fade-in-item').forEach((el, i) => {
          (el as HTMLElement).style.animationDelay = `${i * 90}ms`;
        });
      }, 50);
    }
  }, [resume]);

  /* 
   * Handle the intro completion signal from child components.
   * We add the 'intro-finished' class to the body here so that 
   * CSS-based stagger animations (.fade-in-item) can trigger.
   */
  const handleIntroComplete = () => {
    setIntroFinished(true);
    document.body.classList.add('intro-finished');
  };

  useEffect(() => {
    if (resume) {
      setTimeout(() => {
        document.querySelectorAll('.fade-in-item').forEach((el, i) => {
          (el as HTMLElement).style.animationDelay = `${i * 90}ms`;
        });
      }, 50);
    }
  }, [resume]);

  if (error) {
    return (
      <div style={{
        display: 'flex',
        height: '100dvh',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
        color: '#6B6564',
        padding: '2rem',
        textAlign: 'center',
      }}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <>
      {resume && !introFinished && (
        <>
          {animationVariant === 'glitch' ? (
            <IntroOverlay name={resume.personal.name} onComplete={handleIntroComplete} />
          ) : (
            <StripedIntro name={resume.personal.name} onComplete={handleIntroComplete} />
          )}
        </>
      )}

      {/* Portfolio container.
        Note: The 'glitch' intro relies on measuring #portfolio-name during its animation,
        so we keep it in the DOM. We add 'intro-variant-glitch' class to allow CSS 
        to hide the name initially ONLY for that variant.
      */}
      <div
        id="portfolio"
        className={animationVariant === 'glitch' ? 'intro-variant-glitch' : ''}
        style={{ opacity: introFinished ? 1 : 0, transition: 'opacity 0.3s ease' }}
      >
        <SplitLayout resume={resume} isLoading={isLoading} />
      </div>
    </>
  );
}