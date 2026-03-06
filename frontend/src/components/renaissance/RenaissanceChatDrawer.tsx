/**
 * RenaissanceChatDrawer.tsx
 * ──────────────────────────
 * A parchment-styled slide-up chat drawer docked at the bottom of the
 * Renaissance theme. Fully self-contained — owns its own useChat state.
 * The toggle button sits at the bottom-centre of the viewport.
 */

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { useChat } from '../../hooks/useChat';
import type { Message } from '../../types';
import './RenaissanceChatDrawer.css';

/* ── Typing indicator ─────────────────────────────────────────────────────── */
function Typing() {
    return (
        <div className="r-typing">
            <span>Consulting the oracle</span>
            <div className="r-typing-dot" />
            <div className="r-typing-dot" />
            <div className="r-typing-dot" />
        </div>
    );
}

/* ── Single message bubble ────────────────────────────────────────────────── */
function Bubble({ msg }: { msg: Message }) {
    if (msg.role === 'user') {
        return <div className="r-msg-user">{msg.content}</div>;
    }
    return (
        <div className="r-msg-assistant">
            {/* Render **bold** markdown simply */}
            {msg.content.split(/(\*\*.*?\*\*)/g).map((part, i) =>
                part.startsWith('**') && part.endsWith('**')
                    ? <strong key={i}>{part.slice(2, -2)}</strong>
                    : <span key={i}>{part}</span>
            )}
        </div>
    );
}

/* ── Main drawer component ────────────────────────────────────────────────── */
export default function RenaissanceChatDrawer() {
    const [open, setOpen] = useState(false);
    const [text, setText] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const { messages, isLoading, error, sendMessage, clearError } = useChat();

    /* Auto-scroll to newest message */
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    /* Focus textarea when drawer opens */
    useEffect(() => {
        if (open) {
            setTimeout(() => textareaRef.current?.focus(), 350);
        }
    }, [open]);

    function submit() {
        const trimmed = text.trim();
        if (trimmed && !isLoading) {
            sendMessage(trimmed);
            setText('');
        }
    }

    function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
        }
    }

    const SUGGESTIONS = [
        'What projects has he worked on?',
        "What's his AI tech stack?",
        'Tell me about his education',
        'What is he passionate about?',
    ];

    const showWelcome = messages.length === 0 && !isLoading;

    return (
        <>
            {/* ── Toggle button (always visible when closed, bottom-centre) ── */}
            <button
                className={`r-chat-toggle ${open ? 'open' : ''}`}
                onClick={() => setOpen((o) => !o)}
                aria-label={open ? 'Close oracle' : 'Open oracle chat'}
            >
                <span className="r-ct-glyph">⊕</span>
                {open ? 'Close the Oracle' : 'Enquire of the Oracle'}
                <span className={`r-ct-dot ${isLoading ? 'thinking' : ''}`} />
            </button>

            {/* ── Sliding drawer ── */}
            <div className={`r-chat-drawer ${open ? 'open' : ''}`} role="dialog" aria-label="Resume Oracle Chat">

                {/* Header */}
                <div className="r-drawer-head">
                    <div className="r-drawer-head-left">
                        <span className="r-drawer-title">The Oracle</span>
                        <span className="r-drawer-subtitle">Resume Intelligence · Powered by AI</span>
                    </div>
                    <div className="r-drawer-status">
                        <span className={`r-ct-dot ${isLoading ? 'thinking' : ''}`} style={{ display: 'inline-block' }} />
                        <span>{isLoading ? 'Consulting archives...' : 'Ready to dispatch'}</span>
                    </div>
                    <button className="r-drawer-close" onClick={() => setOpen(false)}>
                        Close ✕
                    </button>
                </div>

                {/* Error banner */}
                {error && (
                    <div className="r-chat-error">
                        <span>{error}</span>
                        <button onClick={clearError}>✕</button>
                    </div>
                )}

                {/* Message thread */}
                <div className="r-drawer-thread">

                    {/* Welcome / empty state */}
                    {showWelcome && (
                        <div className="r-welcome">
                            <p>
                                "Hail, visitor. I am Rohit's resume oracle — keeper of his skills,
                                campaigns, and academic scrolls. Put your enquiry to me and I shall
                                dispatch a reply of considerable accuracy."
                            </p>
                            <div className="r-welcome-byline">— The Oracle, Pune Station · Ready for queries</div>
                            <div className="r-suggestions">
                                {SUGGESTIONS.map((s) => (
                                    <button key={s} className="r-suggestion-pill" onClick={() => { sendMessage(s); setOpen(true); }}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Messages */}
                    {messages.map((msg) => <Bubble key={msg.id} msg={msg} />)}

                    {/* Typing */}
                    {isLoading && <Typing />}

                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="r-drawer-input-area">
                    <textarea
                        ref={textareaRef}
                        className="r-drawer-textarea"
                        placeholder="Dispatch your enquiry to the oracle..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKey}
                        disabled={isLoading}
                        rows={1}
                        aria-label="Chat input"
                    />
                    <button
                        className="r-drawer-send"
                        onClick={submit}
                        disabled={!text.trim() || isLoading}
                        aria-label="Send"
                    >
                        Dispatch ⊕
                    </button>
                </div>
                <div className="r-drawer-hint">Press Enter to send · Shift+Enter for new line</div>

            </div>
        </>
    );
}
