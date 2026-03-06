/*
 * App.tsx
 * ────────
 * Supports two themes: 'modern' (original) and 'renaissance'.
 * A floating ThemeSwitcher button lets the user toggle between them.
 * All original intro animation and portfolio logic is fully preserved.
 */

import { useEffect, useState, useMemo } from 'react';
import type { ResumeData } from './types';
import SplitLayout from './components/layout/SplitLayout';
import IntroOverlay from './components/layout/IntroOverlay';
import StripedIntro from './components/layout/StripedIntro';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import RenaissanceTheme from './components/renaissance/RenaissanceTheme';
import ThemeSwitcher from './components/renaissance/ThemeSwitcher';
import './styles/globals.css';

/* Base API URL from .env */
const API_BASE = import.meta.env.VITE_API_BASE_URL;

/* ── Inner app — must live inside ThemeProvider so useTheme() works ── */
function AppInner() {
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [introFinished, setIntroFinished] = useState(false);

  const { activeTheme } = useTheme();

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
      {/* ── Intro animation (only plays on first load, Modern theme only) ── */}
      {resume && !introFinished && activeTheme === 'modern' && (
        <>
          {animationVariant === 'glitch' ? (
            <IntroOverlay name={resume.personal.name} onComplete={handleIntroComplete} />
          ) : (
            <StripedIntro name={resume.personal.name} onComplete={handleIntroComplete} />
          )}
        </>
      )}

      {/* ── Theme switcher button (always visible after intro) ── */}
      {introFinished && <ThemeSwitcher />}

      {/* ── Renaissance theme ── */}
      {activeTheme === 'renaissance' && (
        <RenaissanceTheme resume={resume} />
      )}

      {/* ── Modern (original) portfolio ──────────────────────────────────────
          Note: kept in DOM even when renaissance is active so the 'glitch'
          intro can measure #portfolio-name. Hidden via display:none instead
          of conditional rendering to preserve DOM references.
      ── */}
      <div
        id="portfolio"
        className={animationVariant === 'glitch' ? 'intro-variant-glitch' : ''}
        style={{
          opacity: introFinished && activeTheme === 'modern' ? 1 : 0,
          transition: 'opacity 0.3s ease',
          // Visually hide and remove from layout when renaissance is active
          display: activeTheme === 'renaissance' ? 'none' : undefined,
        }}
      >
        <SplitLayout resume={resume} isLoading={isLoading} />
      </div>
    </>
  );
}

/* ── Root export — wraps AppInner in ThemeProvider ── */
export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}