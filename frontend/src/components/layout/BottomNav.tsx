/*
 * components/layout/BottomNav.tsx
 * ───────────────────────────────
 * Glass Bottom Navigation — dots above labels, stream connects horizontally.
 * Each label column is LABEL_W px wide; each dot is centred in its column.
 * Auto-hides after 5s of inactivity.
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import './BottomNav.css';

const SECTIONS = [
    { id: 'about', label: 'About', num: '01' },
    { id: 'skills', label: 'Skills', num: '02' },
    { id: 'projects', label: 'Projects', num: '03' },
    { id: 'education', label: 'Education', num: '04' },
    { id: 'contact', label: 'Contact', num: '05' },
];

const TOTAL = SECTIONS.length;
const LABEL_W = 90;                                               // px — each column width
const NODE_X = SECTIONS.map((_, i) => i * LABEL_W + LABEL_W / 2); // dot centred in column
const SVG_W = LABEL_W * TOTAL;                                  // 450
const SVG_H = 20;
const PATH_LEN = NODE_X[TOTAL - 1] - NODE_X[0];                  // span first→last dot
const PROGRESS = SECTIONS.map((_, i) => i / (TOTAL - 1));

export default function BottomNav({ isChatMinimized }: { isChatMinimized: boolean }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Show + reset inactivity timer ─────────────────────────────────────────
    const bumpActivity = () => {
        setIsVisible(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => setIsVisible(false), 5000);
    };

    // ── Scroll detection ──────────────────────────────────────────────────────
    useEffect(() => {
        const container = document.querySelector('.panel-wrapper--left') as HTMLElement | null;
        if (!container) return;

        const handleScroll = () => {
            bumpActivity();
            let found = 0;
            for (let i = 0; i < TOTAL; i++) {
                const el = document.getElementById(SECTIONS[i].id);
                if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.6) found = i;
            }
            setActiveIndex(found);
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    // ── Global activity (mousemove, keydown) ──────────────────────────────────
    useEffect(() => {
        window.addEventListener('mousemove', bumpActivity, { passive: true });
        window.addEventListener('keydown', bumpActivity, { passive: true });
        const init = setTimeout(bumpActivity, 800);
        return () => {
            window.removeEventListener('mousemove', bumpActivity);
            window.removeEventListener('keydown', bumpActivity);
            clearTimeout(init);
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, []);

    // ── Click → smooth scroll ─────────────────────────────────────────────────
    const scrollToSection = (id: string, index: number) => {
        setActiveIndex(index);
        bumpActivity();
        const target = document.getElementById(id);
        const container = document.querySelector('.panel-wrapper--left') as HTMLElement | null;
        if (target && container) {
            container.scrollTo({
                top: container.scrollTop
                    + target.getBoundingClientRect().top
                    - container.getBoundingClientRect().top
                    - 40,
                behavior: 'smooth',
            });
        }
    };

    const dashOffset = PATH_LEN - PATH_LEN * PROGRESS[activeIndex];

    return (
        <motion.nav
            className="bottom-nav"
            aria-label="Section navigation"
            initial={{ y: 80, opacity: 0, x: '-50%' }}
            animate={{
                y: isVisible ? 0 : 80,
                opacity: isVisible ? 1 : 0,
                x: '-50%',
                left: isChatMinimized ? 'calc(50vw - 32px)' : '31vw',
            }}
            transition={{
                y: { duration: 0.55, ease: [0.34, 1.2, 0.64, 1] },
                opacity: { duration: 0.4 },
                left: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
            }}
        >
            {/* ── SVG: track + glow + stream + nodes ── */}
            <div className="bn-svg-row">
                <svg
                    className="bn-svg"
                    width={SVG_W}
                    height={SVG_H}
                    viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                    overflow="visible"
                    aria-hidden="true"
                >
                    {/* Track */}
                    <line className="bn-track"
                        x1={NODE_X[0]} y1="10"
                        x2={NODE_X[TOTAL - 1]} y2="10"
                    />
                    {/* Glow */}
                    <line className="bn-glow"
                        x1={NODE_X[0]} y1="10"
                        x2={NODE_X[TOTAL - 1]} y2="10"
                        style={{ strokeDasharray: PATH_LEN, strokeDashoffset: dashOffset }}
                    />
                    {/* Stream */}
                    <line className="bn-stream"
                        x1={NODE_X[0]} y1="10"
                        x2={NODE_X[TOTAL - 1]} y2="10"
                        style={{ strokeDasharray: PATH_LEN, strokeDashoffset: dashOffset }}
                    />

                    {/* Nodes */}
                    {SECTIONS.map((section, i) => {
                        const cx = NODE_X[i];
                        const isActive = i === activeIndex;
                        const filled = i <= activeIndex;
                        return (
                            <g key={section.id}
                                onClick={() => scrollToSection(section.id, i)}
                                style={{ cursor: 'pointer' }}>
                                <title>{section.label}</title>
                                <circle className={`bn-ring-pulse${isActive ? ' active' : ''}`}
                                    cx={cx} cy="10" r="5" />
                                <circle className={`bn-ring${isActive ? ' active' : ''}`}
                                    cx={cx} cy="10" r="8" />
                                <circle className="bn-dot"
                                    cx={cx} cy="10"
                                    r={isActive ? 6 : filled ? 5 : 4}
                                    fill={filled ? 'var(--bn-water)' : 'var(--color-bg, #FAF8F4)'}
                                    stroke={filled ? 'var(--bn-water)' : 'var(--color-text-muted, #C4B5A5)'}
                                    strokeWidth={filled ? 0 : 1.5}
                                />
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* ── Labels — same width as each SVG column ── */}
            <ul className="bn-labels" role="list">
                {SECTIONS.map((section, i) => (
                    <li
                        key={section.id}
                        className={`bn-label-wrap${activeIndex === i ? ' active' : ''}`}
                        style={{ width: `${LABEL_W}px` }}
                        onClick={() => scrollToSection(section.id, i)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && scrollToSection(section.id, i)}
                        aria-current={activeIndex === i ? 'location' : undefined}
                    >
                        <span className="bn-label-text">{section.label}</span>
                    </li>
                ))}
            </ul>
        </motion.nav>
    );
}