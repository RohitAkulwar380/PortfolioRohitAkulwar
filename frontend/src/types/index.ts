/**
 * types/index.ts
 * ──────────────
 * Shared TypeScript interfaces used across the app.
 * Single source of truth for data shapes — DRY.
 *
 * If a type is only used in one component, it lives there.
 * If it crosses two or more modules, it belongs here.
 */

/* ── Chat ─────────────────────────────────────────────────────────────────── */

export type MessageRole = 'user' | 'assistant';

export interface Message {
    id: string;             // UUID — used as React key
    role: MessageRole;
    content: string;
    timestamp: Date;
}

export interface ChatRequest {
    message: string;
    session_id?: string;    // Optional: auto-generated server-side if omitted
}

export interface ChatResponse {
    reply: string;
    session_id: string;
}

/* ── Resume ───────────────────────────────────────────────────────────────── */

export interface PersonalInfo {
    name: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    github: string;
    objective: string;
}

export interface Education {
    degree: string;
    institution: string;
    dates: string;
    score: string;
}

export interface Skills {
    technical: string[];
    soft: string[];
}

export interface Project {
    title: string;
    description: string;
    technologies: string[];
    videoUrl?: string;   // <-- Added for video
    posterUrl?: string;  // <-- Added for fallback image
}

export interface ResumeData {
    personal: PersonalInfo;
    education: Education[];
    skills: Skills;
    projects: Project[];
}
