import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import type { Theme } from '../../contexts/ThemeContext';
import './ThemeSwitcher.css';

export default function ThemeSwitcher() {
    const { activeTheme, switchTheme, isTransitioning } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [showLabel, setShowLabel] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Show label for 2 seconds on mount or theme change
    useEffect(() => {
        setShowLabel(true);
        const timer = setTimeout(() => setShowLabel(false), 2000);
        return () => clearTimeout(timer);
    }, [activeTheme]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const themes: { id: Theme; label: string; icon: string }[] = [
        { id: 'modern', label: 'Modern', icon: '◈' },
        { id: 'renaissance', label: 'Renaissance', icon: '⚜' },
        { id: 'architectural', label: 'Architectural', icon: '◩' }
    ];

    const currentThemeData = themes.find(t => t.id === activeTheme) || themes[0];

    return (
        <div className="theme-switcher-container" ref={dropdownRef}>
            <button
                className={`theme-switcher-btn style-${activeTheme} ${showLabel ? 'show-label' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                disabled={isTransitioning}
                title="Change Theme"
                aria-label="Change Theme"
            >
                <span className="switcher-icon">{currentThemeData.icon}</span>
                <span className="switcher-label">{currentThemeData.label} View</span>
            </button>

            {isOpen && (
                <div className="theme-dropdown-menu">
                    {themes.map(theme => (
                        <button
                            key={theme.id}
                            className={`theme-dropdown-item ${activeTheme === theme.id ? 'active' : ''}`}
                            onClick={() => {
                                switchTheme(theme.id);
                                setIsOpen(false);
                            }}
                            disabled={isTransitioning || activeTheme === theme.id}
                        >
                            <span className="dropdown-icon">{theme.icon}</span>
                            {theme.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
