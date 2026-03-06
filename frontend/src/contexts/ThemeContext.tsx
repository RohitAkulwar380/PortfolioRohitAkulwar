/**
 * contexts/ThemeContext.tsx
 * ──────────────────────────
 * Provides global theme state — 'modern' (original portfolio) or 'renaissance'.
 * Consume with the useTheme() hook anywhere in the tree.
 */

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export type Theme = 'modern' | 'renaissance';

interface ThemeContextValue {
    activeTheme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [activeTheme, setActiveTheme] = useState<Theme>('modern');

    const toggleTheme = () =>
        setActiveTheme((prev) => (prev === 'modern' ? 'renaissance' : 'modern'));

    return (
        <ThemeContext.Provider value={{ activeTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
    return ctx;
}
