/*
 * components/chat/MessageThread.tsx
 * ──────────────────────────────────
 * Renders the scrollable list of chat messages with interactive pills.
 */

import { useEffect, useRef, type ReactNode } from 'react';
import type { Message } from '../../types';
import './MessageThread.css';

interface MessageThreadProps {
    messages: Message[];
    isLoading: boolean;
    onSendMessage: (msg: string) => void;
}

/* Typing indicator */
function TypingIndicator() {
    return (
        <div className="msg-wrap assistant" aria-label="AI is typing">
            <div className="typing-wrap">
                <span className="typing-label">thinking</span>
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
            </div>
        </div>
    );
}

/* ── Custom Text Formatter ── */
const HIGHLIGHT_RULES = [
    { regex: /\b(Master of Computer Applications|Bachelor of Business Administration|Computer Applications|Business Administration|MCA|BBA|CGPA)\b/gi, type: 'edu' },
    { regex: /\b(Python|Java|Kotlin|HTML|CSS|JavaScript|TypeScript|React|Node\.js|Express\.js|PyGame|Django)\b/gi, type: 'lang' },
    { regex: /\b(MySQL|n8n|Git|GitHub|Docker|SQL|OpenRouter)\b/gi, type: 'tool' },
    { regex: /\b(Prompt engineering|Machine learning|AI|Artificial Intelligence|Workflow automation|Automation|Software Developer|Software Development|API|Full Stack|Web Development|Communication|Adaptability|Teamwork|Time Management)\b/gi, type: 'concept' },
    { regex: /\b(Education|Skills|Projects|Experience|Contact|About)(?=:)/gi, type: 'heading' }
];

function renderHighlights(text: string, onTagClick: (tag: string) => void) {
    let chunks: ReactNode[] = [text];

    HIGHLIGHT_RULES.forEach((rule, ruleIdx) => {
        chunks = chunks.flatMap((chunk, chunkIdx): ReactNode[] => {
            if (typeof chunk !== 'string') return [chunk];

            const parts = chunk.split(rule.regex);
            return parts.map((part, i) => {
                if (i % 2 === 1) {
                    return (
                        <button
                            key={`${ruleIdx}-${chunkIdx}-${i}`}
                            className={`message__keyword message__keyword--${rule.type}`}
                            onClick={() => onTagClick(part)}
                            title={`Ask about ${part}`}
                        >
                            {part}
                        </button>
                    );
                }
                return part;
            });
        });
    });

    return chunks;
}

function FormattedMessage({ content, onTagClick }: { content: string, onTagClick: (t: string) => void }) {
    const boldParts = content.split(/(\*\*.*?\*\*)/g);

    return (
        <>
            {boldParts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    const innerText = part.slice(2, -2);
                    return <strong key={i}>{renderHighlights(innerText, onTagClick)}</strong>;
                }
                return <span key={i}>{renderHighlights(part, onTagClick)}</span>;
            })}
        </>
    );
}

export default function MessageThread({ messages, isLoading, onSendMessage }: MessageThreadProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleTagClick = (tagContent: string) => {
        onSendMessage(`Tell me more about his ${tagContent}`);
    };

    /* Empty state / Suggestions mapped into the thread directly for layout simplicity */
    const showSuggestions = messages.length === 0 && !isLoading;

    return (
        <>
            <div className="thread-scroll fade-in-item" role="log" aria-live="polite">
                {messages.length === 0 && (
                    <div className="msg-wrap assistant">
                        <div className="bubble-assistant">
                            Hello! I'm Rohit's resume assistant. Ask me anything about his <button className="message__keyword message__keyword--heading" onClick={() => handleTagClick('skills')}>skills</button>, <button className="message__keyword message__keyword--concept" onClick={() => handleTagClick('projects')}>projects</button>, or <button className="message__keyword message__keyword--edu" onClick={() => handleTagClick('education')}>education</button> — I'll give you the full picture.
                        </div>
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className={`msg-wrap ${msg.role}`}>
                        {msg.role === 'user' ? (
                            <div className="bubble-user">{msg.content}</div>
                        ) : (
                            <div className="bubble-assistant">
                                <FormattedMessage content={msg.content} onTagClick={handleTagClick} />
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && <TypingIndicator />}

                <div ref={bottomRef} />
            </div>

            {showSuggestions && (
                <div className="suggestions-area fade-in-item">
                    <p className="suggestions-label">Try asking</p>
                    <div className="suggestions-list">
                        {[
                            "What projects has he worked on?",
                            "What's his tech stack?",
                            "Tell me about his education",
                            "What is he passionate about?"
                        ].map((q) => (
                            <button
                                key={q}
                                className="suggestion-pill"
                                onClick={() => onSendMessage(q)}
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
