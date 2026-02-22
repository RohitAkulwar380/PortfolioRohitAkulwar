/**
 * hooks/useChat.ts
 * ─────────────────
 * Single Responsibility: all chat state and API communication lives here.
 * Components (ChatInput, MessageThread) are purely presentational.
 *
 * Session ID is persisted to sessionStorage so a page refresh starts fresh,
 * but navigating within the app keeps the same conversation.
 */

import { useState, useCallback, useRef } from 'react';
import type { Message, ChatRequest, ChatResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

/* Generate a client-side UUID for message keys */
function uuid(): string {
    return crypto.randomUUID();
}

/* Retrieve or create a session ID, persisted in sessionStorage */
function getSessionId(): string {
    const key = 'portfolio_session_id';
    let id = sessionStorage.getItem(key);
    if (!id) {
        id = uuid();
        sessionStorage.setItem(key, id);
    }
    return id;
}

export interface UseChatReturn {
    messages: Message[];
    isLoading: boolean;
    error: string | null;
    sendMessage: (text: string) => Promise<void>;
    clearError: () => void;
}

export function useChat(): UseChatReturn {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const sessionId = useRef<string>(getSessionId());

    const sendMessage = useCallback(async (text: string) => {
        const trimmed = text.trim();
        if (!trimmed || isLoading) return;

        /* Optimistically add the user message immediately */
        const userMsg: Message = {
            id: uuid(),
            role: 'user',
            content: trimmed,
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMsg]);
        setIsLoading(true);
        setError(null);

        try {
            const payload: ChatRequest = {
                message: trimmed,
                session_id: sessionId.current,
            };

            const res = await fetch(`${API_BASE}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const detail = await res.json().catch(() => ({}));
                throw new Error((detail as { detail?: string }).detail ?? `HTTP ${res.status}`);
            }

            const data = (await res.json()) as ChatResponse;

            /* Persist session_id from server response (server may generate one) */
            sessionId.current = data.session_id;
            sessionStorage.setItem('portfolio_session_id', data.session_id);

            const assistantMsg: Message = {
                id: uuid(),
                role: 'assistant',
                content: data.reply,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, assistantMsg]);

        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Something went wrong';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading]);

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        clearError: () => setError(null),
    };
}
