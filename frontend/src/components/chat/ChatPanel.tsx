/*
 * components/chat/ChatPanel.tsx
 * ──────────────────────────────
 * Redesigned chat panel structure holding the new header and threads.
 */

import type { UseChatReturn } from '../../hooks/useChat';
import MessageThread from './MessageThread';
import ChatInput from './ChatInput';
import './ChatPanel.css';

interface ChatPanelProps {
    chatState: UseChatReturn;
    onClose?: () => void;
}

export default function ChatPanel({ chatState, onClose }: ChatPanelProps) {
    const { messages, isLoading, error, sendMessage, clearError } = chatState;

    return (
        <div className="chat-panel">

            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="chat-header fade-in-item">
                <div className="header-top">
                    <div>
                        <div className="header-meta">
                            <p className="header-eyebrow">Resume Assistant</p>
                            <div className="meta-divider"></div>
                            <div className="status-wrap">
                                <div className={`status-dot ${isLoading ? 'thinking' : ''}`}></div>
                                <span className="status-label">{isLoading ? 'Thinking...' : 'Ready'}</span>
                            </div>
                        </div>
                        <h2 className="header-title">Ask my resume<br /><em>anything</em></h2>
                    </div>
                    {onClose && (
                        <button
                            className="chat-close-btn"
                            onClick={onClose}
                            aria-label="Minimize Chat"
                            title="Minimize Chat"
                        >
                            <span className="close-text">Close</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </button>
                    )}
                </div>
                <div className="header-rule"></div>
            </div>

            {/* ── Error banner (Optional) ─────────────────────────────────── */}
            {error && (
                <div style={{ backgroundColor: '#fdf0ec', padding: '8px 24px', color: '#c47c5a', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{error}</span>
                    <button onClick={clearError} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                </div>
            )}

            {/* ── Message thread ──────────────────────────────────────────── */}
            <MessageThread messages={messages} isLoading={isLoading} onSendMessage={sendMessage} />

            {/* ── Input ───────────────────────────────────────────────────── */}
            <ChatInput onSend={sendMessage} isLoading={isLoading} />

        </div>
    );
}
