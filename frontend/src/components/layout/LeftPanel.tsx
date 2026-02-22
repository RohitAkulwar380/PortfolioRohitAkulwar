/*
 * components/layout/LeftPanel.tsx
 * ─────────────────────────────────
 * Single Responsibility: scrollable container for all portfolio sections.
 * Imports and sequences section components — no data fetching here.
 * Data flows in from App.tsx as props once the resume API call resolves.
 */

import type { ResumeData } from '../../types';
import Hero from '../portfolio/Hero';
import About from '../portfolio/About';
import Skills from '../portfolio/Skills';
import Projects from '../portfolio/Projects';
import Education from '../portfolio/Education';
import Contact from '../portfolio/Contact';
import BottomNav from './BottomNav';
import TopNav from './TopNav';
import './LeftPanel.css';

interface LeftPanelProps {
    resume: ResumeData | null;       // null while loading
    isLoading: boolean;
    isChatMinimized: boolean;
    setIsChatMinimized: (isMinimized: boolean) => void;
    setActiveTab: (tab: 'portfolio' | 'chat') => void;
    sendMessage: (text: string) => Promise<void>;
}

export default function LeftPanel({ resume, isLoading, isChatMinimized, setIsChatMinimized, setActiveTab, sendMessage }: LeftPanelProps) {
    if (isLoading) {
        return (
            <div className="left-panel left-panel--loading">
                <div className="loading-pulse" aria-label="Loading portfolio…" />
            </div>
        );
    }

    if (!resume) return null;

    return (
        <main className="left-panel" id="main-content">
            <TopNav personal={resume.personal} isChatMinimized={isChatMinimized} />
            <BottomNav isChatMinimized={isChatMinimized} />
            <Hero
                personal={resume.personal}
                skills={resume.skills}
                isChatMinimized={isChatMinimized}
            />
            <About personal={resume.personal} />
            <Skills
                skills={resume.skills}
                setIsChatMinimized={setIsChatMinimized}
                setActiveTab={setActiveTab}
                sendMessage={sendMessage}
            />
            <Projects
                projects={resume.projects}
                setIsChatMinimized={setIsChatMinimized}
                setActiveTab={setActiveTab}
                sendMessage={sendMessage}
            />
            <Education education={resume.education} />
            <Contact personal={resume.personal} />
        </main>
    );
}
