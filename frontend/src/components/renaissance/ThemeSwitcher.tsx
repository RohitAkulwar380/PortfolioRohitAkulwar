/**
 * ThemeSwitcher.tsx
 * ──────────────────
 * Fixed floating button that toggles between Modern and Renaissance themes.
 * Always visible in the bottom-right corner.
 */

import { useTheme } from '../../contexts/ThemeContext';
import './ThemeSwitcher.css';

export default function ThemeSwitcher() {
    const { activeTheme, toggleTheme } = useTheme();

    const isRenaissance = activeTheme === 'renaissance';

    return (
        <button
            className={`theme-switcher-btn ${isRenaissance ? 'style-renaissance' : 'style-modern'}`}
            onClick={toggleTheme}
            title={isRenaissance ? 'Switch to Modern theme' : 'Switch to Renaissance theme'}
            aria-label={isRenaissance ? 'Switch to Modern theme' : 'Switch to Renaissance theme'}
        >
            <span className="switcher-icon">{isRenaissance ? '◈' : '⚜'}</span>
            {isRenaissance ? 'Modern View' : 'Renaissance'}
        </button>
    );
}
