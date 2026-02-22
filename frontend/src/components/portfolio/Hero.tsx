/*
 * components/portfolio/Hero.tsx
 * ──────────────────────────────
 * Single Responsibility: Display name, title, tagline, and social links.
 * Props-driven — no data fetching.
 */

import type { PersonalInfo, Skills } from '../../types';
import { useTypewriter } from '../../hooks/useTypewriter';
import { motion } from 'framer-motion';
import './Hero.css';

interface HeroProps {
    personal: PersonalInfo;
    skills: Skills;
    isChatMinimized: boolean;
}

export default function Hero({ personal, skills, isChatMinimized }: HeroProps) {
    // Combine the title with technical skills for the typewriter effect
    const typewriterWords = [personal.title, ...skills.technical];
    const animatedText = useTypewriter(typewriterWords, 80, 50, 2500, 4500);

    return (
        <section className="hero section" aria-label="Hero">
            <div className="hero__layout">
                <div className="hero__content">
                    {/* Eyebrow label */}
                    <p className="hero__eyebrow fade-in-item">Portfolio</p>

                    {/* Name — the centrepiece, Cormorant Garamond */}
                    <h1 className="hero__name" id="portfolio-name">
                        {(() => {
                            const parts = personal.name.split(' ');
                            if (parts.length <= 1) return personal.name;
                            const lastWord = parts.pop();
                            const rest = parts.join(' ');
                            return <>{rest} <em>{lastWord}</em></>;
                        })()}
                    </h1>

                    {/* Animated Title */}
                    <p className="hero__title fade-in-item" aria-live="polite">
                        {animatedText}
                        <span className="hero__cursor" aria-hidden="true">|</span>
                    </p>

                    {/* Social links */}
                    <div className="hero__links fade-in-item">
                        <a
                            href={personal.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hero__link"
                            aria-label="LinkedIn profile"
                        >
                            LinkedIn
                        </a>
                        <span className="hero__link-separator" aria-hidden="true">·</span>
                        <a
                            href={personal.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hero__link"
                            aria-label="GitHub profile"
                        >
                            GitHub
                        </a>
                        <span className="hero__link-separator" aria-hidden="true">·</span>
                        <a
                            href={`mailto:${personal.email}`}
                            className="hero__link"
                            aria-label="Send email"
                        >
                            Email
                        </a>
                    </div>
                </div>

                {/* Profile Image (Dynamic size via Framer Motion) */}
                <motion.div
                    className="hero__image-wrapper fade-in-item"
                    initial={false}
                    animate={{
                        width: window.innerWidth > 768 ? (isChatMinimized ? 280 : 140) : 220,
                        height: window.innerWidth > 768 ? (isChatMinimized ? 280 : 140) : 220
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 120,
                        damping: 14,
                        mass: 0.8
                    }}
                >
                    <img
                        src="/RohitProfilePhoto.jpeg"
                        alt={`${personal.name} profile`}
                        className="hero__image"
                    />
                </motion.div>
            </div>
        </section>
    );
}