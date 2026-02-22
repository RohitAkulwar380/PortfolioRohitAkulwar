/*
 * components/layout/SplitLayout.tsx
 * ───────────────────────────────────
 * Single Responsibility: Top-level layout shell only.
 * Manages the 62/38 split between portfolio and chat panels.
 * Contains NO data-fetching or business logic whatsoever.
 *
 * On mobile (< 768px) the panels stack vertically with a tab toggle.
 */

import { useState } from 'react';
import type { ResumeData } from '../../types';
import LeftPanel from './LeftPanel'
import RightPanel from './RightPanel';
import { useChat } from '../../hooks/useChat';
import './SplitLayout.css';

/* The two tabs shown on mobile */
type MobileTab = 'portfolio' | 'chat';

interface SplitLayoutProps {
    resume: ResumeData | null;
    isLoading: boolean;
}

export default function SplitLayout({ resume, isLoading }: SplitLayoutProps) {
    /* Mobile tab state — only relevant below 768px breakpoint */
    const [activeTab, setActiveTab] = useState<MobileTab>('portfolio');

    /* Desktop sidebar minimization state */
    const [isChatMinimized, setIsChatMinimized] = useState(false);

    /* Lifted Chat State: Allows left-panel components (like Project cards) to trigger messages */
    const chatState = useChat();

    return (
        <div className={`split-layout ${isChatMinimized ? 'split-layout--minimized-chat' : ''}`}>

            {/* ── Mobile tab bar ─────────────────────────────────────────────── */}
            <nav className="mobile-tabs" aria-label="View selector">
                <button
                    className={`tab-btn ${activeTab === 'portfolio' ? 'tab-btn--active' : ''}`}
                    onClick={() => setActiveTab('portfolio')}
                    aria-pressed={activeTab === 'portfolio'}
                >
                    Portfolio
                </button>
                <button
                    className={`tab-btn ${activeTab === 'chat' ? 'tab-btn--active' : ''}`}
                    onClick={() => {
                        setActiveTab('chat');
                        setIsChatMinimized(false);
                    }}
                    aria-pressed={activeTab === 'chat'}
                >
                    Ask my resume
                </button>
            </nav>

            {/* ── Left panel — portfolio content ─────────────────────────────── */}
            {/* Hidden on mobile when chat tab is active */}
            <div className={`panel-wrapper panel-wrapper--left ${activeTab === 'chat' ? 'panel-wrapper--hidden-mobile' : ''}`}>
                <LeftPanel
                    resume={resume}
                    isLoading={isLoading}
                    isChatMinimized={isChatMinimized}
                    setIsChatMinimized={setIsChatMinimized}
                    setActiveTab={setActiveTab}
                    sendMessage={chatState.sendMessage}
                />
            </div>

            {/* ── Right panel — chat ──────────────────────────────────────────── */}
            {/* Hidden on mobile when portfolio tab is active */}
            <div className={`panel-wrapper panel-wrapper--right ${activeTab === 'portfolio' ? 'panel-wrapper--hidden-mobile' : ''}`}>
                <RightPanel
                    isMinimized={isChatMinimized}
                    onExpand={() => setIsChatMinimized(false)}
                    onClose={() => setIsChatMinimized(true)}
                    chatState={chatState}
                />
            </div>

        </div>
    );
}
