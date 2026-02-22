/*
 * App.tsx
 * ────────
 * Application root. Single Responsibility: fetch resume data on mount
 * and pass it down to the layout tree via props.
 *
 * All routing, data-fetching, and error handling lives here.
 * Components below App are purely presentational.
 */

import { useEffect, useState } from 'react';
import type { ResumeData } from './types';
import SplitLayout from './components/layout/SplitLayout';
import IntroOverlay from './components/layout/IntroOverlay';
import './styles/globals.css';

/* Base API URL from .env — falls back to localhost for dev */
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export default function App() {
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [introFinished, setIntroFinished] = useState(false);

  useEffect(() => {
    /* Fetch resume from our FastAPI backend on mount — once only */
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
  }, []); /* Empty deps — run once on mount */

  /*
   * Assign stagger animation delays once the resume DOM has rendered.
   * By using inline styles for the delay, React won't overwrite them on re-renders,
   * but the CSS animation itself will drive the opacity safely.
   */
  useEffect(() => {
    if (resume) {
      // Small timeout to ensure SplitLayout children have mounted into the DOM
      setTimeout(() => {
        document.querySelectorAll('.fade-in-item').forEach((el, i) => {
          (el as HTMLElement).style.animationDelay = `${i * 90}ms`;
        });
      }, 50);
    }
  }, [resume]);

  /* Error state — only shown if the backend is completely unreachable */
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

  /*
   * Pass resume + loading state down to LeftPanel via SplitLayout.
   * IntroOverlay runs initially if we have the resume data.
   */
  return (
    <>
      {resume && !introFinished && (
        <IntroOverlay name={resume.personal.name} onComplete={() => setIntroFinished(true)} />
      )}

      {/* Portfolio must always be in the DOM (opacity 0 until intro done)
          so getBoundingClientRect() can measure portfolio-name during the fly. */}
      <div
        id="portfolio"
        style={{ opacity: introFinished ? 1 : 0, transition: 'opacity 0.3s ease' }}
      >
        <SplitLayout resume={resume} isLoading={isLoading} />
      </div>
    </>
  );
}
