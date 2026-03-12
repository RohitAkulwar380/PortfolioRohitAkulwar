/**
 * contexts/ThemeContext.tsx
 * ──────────────────────────
 * Provides global theme state — 'modern' (original portfolio) or 'renaissance'.
 * switchTheme() triggers the vintage-film transition overlay before swapping.
 */

import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

export type Theme = 'modern' | 'renaissance' | 'architectural';

interface ThemeContextValue {
    activeTheme: Theme;
    isTransitioning: boolean;
    switchTheme: (targetTheme: Theme) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [activeTheme, setActiveTheme] = useState<Theme>('modern');
    const [isTransitioning, setIsTransitioning] = useState(false);

    // No longer used, handled by switchTheme, but keeping signature for now
    const toggleTheme = useCallback(() => { }, []);

    const switchTheme = useCallback((targetTheme: Theme) => {
        if (isTransitioning || activeTheme === targetTheme) return;

        if (targetTheme === 'renaissance') {
            setIsTransitioning(true);
            // Swap theme at 2.8s — deep inside the end-of-reel chaos window
            setTimeout(() => {
                setActiveTheme(targetTheme);
            }, 2800);
            // Clear overlay at 4.5s — full 4s cycle + small fade buffer
            setTimeout(() => {
                setIsTransitioning(false);
            }, 4500);
        } else {
            // Instant switch for 'modern' and 'architectural'.
            // Their own respective components handle their entrance animations.
            setActiveTheme(targetTheme);
        }
    }, [isTransitioning, activeTheme]);

    return (
        <ThemeContext.Provider value={{ activeTheme, isTransitioning, switchTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
    return ctx;
}
