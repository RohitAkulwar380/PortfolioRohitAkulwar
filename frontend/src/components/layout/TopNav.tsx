/*
 * components/layout/TopNav.tsx
 * ────────────────────────────
 * A sticky glass top navigation that displays the user's name and profile image.
 * Uses Framer Motion to slide in only after the user scrolls past the main name 
 * in the Hero section.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PersonalInfo } from '../../types';
import './TopNav.css';

interface TopNavProps {
    personal: PersonalInfo;
    isChatMinimized: boolean;
}

export default function TopNav({ personal, isChatMinimized }: TopNavProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const container = document.querySelector('.panel-wrapper--left') as HTMLElement | null;
        if (!container) return;

        const handleScroll = () => {
            const nameTarget = document.getElementById('portfolio-name');
            if (nameTarget) {
                // If the bottom of the name container goes above the top of the viewport (0)
                const rect = nameTarget.getBoundingClientRect();
                // Add a small buffer so it feels natural
                if (rect.bottom <= 80) {
                    setIsVisible(true);
                } else {
                    setIsVisible(false);
                }
            }
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Initial check

        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = (e: React.MouseEvent) => {
        e.preventDefault();
        const container = document.querySelector('.panel-wrapper--left') as HTMLElement | null;
        if (container) {
            container.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="top-nav"
                    initial={{ y: "-100%", opacity: 0 }}
                    animate={{
                        y: "0%",
                        opacity: 1,
                        width: isChatMinimized ? "calc(100vw - 64px)" : "62vw"
                    }}
                    exit={{ y: "-100%", opacity: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 25,
                        mass: 0.8,
                        width: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
                    }}
                >
                    <div className="top-nav__content" onClick={scrollToTop} role="button" aria-label="Scroll to top">
                        <span className="top-nav__name">{personal.name}</span>
                        <img
                            src="/RohitProfilePhoto.jpeg"
                            alt={`${personal.name} profile`}
                            className="top-nav__image"
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
