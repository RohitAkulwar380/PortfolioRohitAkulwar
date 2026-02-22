/*
 * components/layout/RightPanel.tsx
 * ──────────────────────────────────
 * Single Responsibility: fixed-height sidebar wrapper for the chat UI.
 * Renders the ChatPanel component — owns no chat state itself.
 */

import ChatPanel from '../chat/ChatPanel';
import type { UseChatReturn } from '../../hooks/useChat';
import './RightPanel.css';

interface RightPanelProps {
    isMinimized?: boolean;
    onExpand?: () => void;
    onClose?: () => void;
    chatState: UseChatReturn;
}

export default function RightPanel({ isMinimized = false, onExpand, onClose, chatState }: RightPanelProps) {
    return (
        <aside
            className={`right-panel ${isMinimized ? 'right-panel--minimized' : ''}`}
            aria-label={isMinimized ? "Minimized chat assistant" : "AI chat assistant"}
        >
            {/* Minimized State: Button */}
            <div className="right-panel__minimized-content" aria-hidden={!isMinimized}>
                <button
                    className="expand-chat-btn"
                    onClick={onExpand}
                    aria-label="Expand Chat"
                    title="Expand Chat"
                    tabIndex={isMinimized ? 0 : -1}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                    <span className="expand-chat-text">Chat</span>
                </button>
            </div>

            {/* Maximized State: Chat Panel */}
            <div className="right-panel__maximized-content" aria-hidden={isMinimized}>
                <ChatPanel chatState={chatState} onClose={onClose} />
            </div>
        </aside>
    );
}
