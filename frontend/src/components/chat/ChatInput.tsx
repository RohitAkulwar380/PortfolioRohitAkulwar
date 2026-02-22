/*
 * components/chat/ChatInput.tsx
 * ─────────────────────────────
 * Redesigned Chat Input area.
 */

import { useState, useRef, type KeyboardEvent } from 'react';
import './ChatInput.css';

interface ChatInputProps {
    onSend: (message: string) => void;
    isLoading: boolean;
}

export default function ChatInput({ onSend, isLoading }: ChatInputProps) {
    const [text, setText] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    function submit() {
        const trimmed = text.trim();
        if (trimmed && !isLoading) {
            onSend(trimmed);
            setText('');
        }
    }

    function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
        // Submit on Enter (without Shift)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
        }
    }

    const isSendable = text.trim().length > 0 && !isLoading;

    return (
        <div className="input-area fade-in-item">
            <div className="input-row">
                <textarea
                    ref={textareaRef}
                    className="chat-input"
                    placeholder="Ask about my experience, skills, projects..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    rows={1}
                    aria-label="Chat input"
                />
                <button
                    className={`send-btn ${isSendable ? 'send-btn--active' : 'send-btn--disabled'}`}
                    onClick={submit}
                    disabled={!isSendable}
                    aria-label="Send message"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M5 12H19M19 12L13 6M19 12L13 18"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
            </div>

            <p className="input-hint">Click any highlighted term to explore further</p>
        </div>
    );
}