/*
 * components/layout/IntroOverlay.tsx
 * ────────────────────────────────────
 * Manages the Spider-Verse glitch intro animation and the fly-away name effect.
 * Signals to the parent application when the animation is completely finished.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import './IntroOverlay.css';

// ─── Font frames ─────────────────────────────────────────────────────────────
// Single locked size — fonts cycle but layout stays stable
const CYCLE_FONT_SIZE = '5.5vw';

const FONT_FRAMES = [
    { font: "'Bodoni Moda', serif", color: '#C4533A', weight: '700' },
    { font: "'Libre Baskerville', serif", color: '#2C1F0E', weight: '700' },
    { font: "'Fraunces', serif", color: '#3A5A3A', weight: '700' },
    { font: "'Spectral', serif", color: '#2A3A6B', weight: '700' },
    { font: "'Inknut Antiqua', serif", color: '#6B3A2A', weight: '700' },
    { font: "'DM Serif Display', serif", color: '#C4A050', weight: '400' },
    { font: "'Yeseva One', serif", color: '#2C1F0E', weight: '400' },
    { font: "'Bodoni Moda', serif", color: '#5A2A6B', weight: '700', style: 'italic' },
    { font: "'Vidaloka', serif", color: '#3A5A3A', weight: '400' },
    { font: "'Rufina', serif", color: '#C4533A', weight: '700' },
    { font: "'Gilda Display', serif", color: '#2A3A6B', weight: '400' },
    { font: "'Sorts Mill Goudy', serif", color: '#6B3A2A', weight: '400', style: 'italic' },
    { font: "'Cardo', serif", color: '#2C1F0E', weight: '700' },
    { font: "'Fraunces', serif", color: '#C4533A', weight: '700', style: 'italic' },
    { font: "'Libre Baskerville', serif", color: '#3A5A3A', weight: '700' },
    // Final — settle into portfolio font
    { font: "'Cormorant Garamond', serif", color: '#2C1F0E', weight: '300' },
] as const;

// ─── Types ───────────────────────────────────────────────────────────────────
interface IntroOverlayProps {
    name: string;
    onComplete: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function IntroOverlay({ name, onComplete }: IntroOverlayProps) {
    const introNameEl = useRef<HTMLDivElement>(null);
    const introWrapEl = useRef<HTMLDivElement>(null);
    const introPanelEl = useRef<HTMLDivElement>(null);
    const flashEl = useRef<HTMLDivElement>(null);
    const flyingEl = useRef<HTMLDivElement>(null);
    const cursorEl = useRef<HTMLSpanElement>(null);

    const [done, setDone] = useState(false);

    const onCompleteRef = useRef(onComplete);
    useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

    const runAnimation = useCallback(() => {
        const nameEl = introNameEl.current;
        const wrapEl = introWrapEl.current;
        const panelEl = introPanelEl.current;
        const flashDiv = flashEl.current;
        const flyingDiv = flyingEl.current;
        const cursor = cursorEl.current;

        if (!nameEl || !wrapEl || !panelEl || !flashDiv || !flyingDiv || !cursor) return;

        // ── PHASE 1: Cursor blink ─────────────────────────────────────────────
        cursor.style.opacity = '1';
        cursor.style.animation = 'blink 0.6s step-end infinite';

        // ── PHASE 2: Font cycling ─────────────────────────────────────────────
        const totalFrames = FONT_FRAMES.length;

        const intervals = FONT_FRAMES.map((_, i) => {
            const t = i / (totalFrames - 1);
            return Math.round(200 - t * t * 140);
        });

        let frameIndex = 0;
        let cycleTimer: ReturnType<typeof setTimeout>;

        const nextFrame = () => {
            if (frameIndex >= totalFrames) {
                snapAndFly();
                return;
            }

            const frame = FONT_FRAMES[frameIndex];
            nameEl.style.fontFamily = frame.font;
            nameEl.style.color = frame.color;
            nameEl.style.fontSize = CYCLE_FONT_SIZE;
            nameEl.style.fontWeight = frame.weight;
            nameEl.style.fontStyle = ('style' in frame ? frame.style : 'normal') as string;

            cursor.style.opacity = '0';
            cursor.style.animation = 'none';

            // Always remove glitch class immediately at frame start — prevents bleed
            wrapEl.classList.remove('glitching');

            const interval = intervals[frameIndex] ?? 60;

            // Only glitch every 3rd frame when interval is long enough to be visible
            if (frameIndex % 3 === 1 && interval > 80) {
                // rAF so the font paint happens before the filter applies
                requestAnimationFrame(() => {
                    wrapEl.classList.add('glitching');
                    // Remove after a short window — never bleeds into next frame
                    setTimeout(() => wrapEl.classList.remove('glitching'), Math.min(interval * 0.4, 50));
                });
            }

            cycleTimer = setTimeout(nextFrame, interval);
            frameIndex++;
        };

        const startDelay = setTimeout(nextFrame, 700);

        // ── PHASE 3: Snap + flash ─────────────────────────────────────────────
        const snapAndFly = () => {
            wrapEl.classList.remove('glitching');
            nameEl.style.fontFamily = "'Cormorant Garamond', serif";
            nameEl.style.color = '#2C1F0E';
            nameEl.style.fontSize = '5.5vw';
            nameEl.style.fontWeight = '300';
            nameEl.style.fontStyle = 'normal';
            nameEl.classList.add('settled');
            wrapEl.classList.remove('glitching');

            flashDiv.style.transition = 'none';
            flashDiv.style.opacity = '1';
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    flashDiv.style.transition = 'opacity 0.22s ease';
                    flashDiv.style.opacity = '0';
                });
            });

            cursor.style.animation = 'blink 0.6s step-end infinite';
            cursor.style.opacity = '1';
            setTimeout(() => {
                cursor.style.opacity = '0';
                cursor.style.animation = 'none';
            }, 260);

            // ── PHASE 4: Fly to position ────────────────────────────────────────
            setTimeout(() => {
                const targetEl = document.getElementById('portfolio-name');
                if (!targetEl) { finishAnimation(); return; }

                const introRect = nameEl.getBoundingClientRect();
                const targetRect = targetEl.getBoundingClientRect();

                if (targetRect.width === 0 || targetRect.height === 0) {
                    finishAnimation();
                    return;
                }

                // Use computed font-size, not bounding box height.
                // The h1 is multi-line (name + em block), so targetRect.height
                // is the full block — way too tall. font-size gives us the
                // actual character size we want to match.
                const introFontSize = parseFloat(getComputedStyle(nameEl).fontSize);
                const targetFontSize = parseFloat(getComputedStyle(targetEl).fontSize);

                nameEl.style.opacity = '0';

                panelEl.style.transition = 'opacity 0.35s ease';
                panelEl.style.opacity = '0';

                const portfolioEl = document.getElementById('portfolio');
                if (portfolioEl) {
                    setTimeout(() => {
                        portfolioEl.style.transition = 'opacity 0.25s ease';
                        portfolioEl.style.opacity = '1';
                    }, 100);
                }

                Object.assign(flyingDiv.style, {
                    display: 'block',
                    fontFamily: "'Cormorant Garamond', serif",
                    color: '#2C1F0E',
                    fontWeight: '300',
                    fontStyle: 'normal',
                    letterSpacing: '-0.02em',
                    lineHeight: '1',
                    left: `${introRect.left}px`,
                    top: `${introRect.top}px`,
                    fontSize: `${introFontSize}px`,
                    opacity: '1',
                    transition: 'none',
                    whiteSpace: 'nowrap',
                });

                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        Object.assign(flyingDiv.style, {
                            transition: [
                                'left 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
                                'top 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
                                'font-size 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
                            ].join(', '),
                            left: `${targetRect.left}px`,
                            top: `${targetRect.top}px`,
                            fontSize: `${targetFontSize}px`,
                        });

                        // ── PHASE 5: Land — instant swap, no flicker ────────────────
                        setTimeout(() => {
                            flyingDiv.style.display = 'none';
                            targetEl.style.opacity = '1';
                            targetEl.style.transition = 'none';

                            finishAnimation();
                        }, 560);
                    });
                });
            }, 280);
        };

        const finishAnimation = () => {
            panelEl.style.display = 'none';
            document.body.classList.add('intro-finished');
            onCompleteRef.current();
            setDone(true);
        };

        return () => {
            clearTimeout(startDelay);
            clearTimeout(cycleTimer);
        };
    }, []);

    useEffect(() => {
        const cleanup = runAnimation();
        return cleanup;
    }, [runAnimation]);

    if (done) return null;

    const formattedName = (() => {
        const parts = name.split(' ');
        if (parts.length <= 1) return (
            <>
                {name}
                <span id="intro-cursor" ref={cursorEl} style={{ opacity: 0 }} />
            </>
        );
        const lastWord = parts.pop();
        const rest = parts.join(' ');
        return (
            <>
                {rest} <em>{lastWord}</em>
                <span id="intro-cursor" ref={cursorEl} style={{ opacity: 0 }} />
            </>
        );
    })();

    const formattedNameNoCursor = (() => {
        const parts = name.split(' ');
        if (parts.length <= 1) return <>{name}</>;
        const lastWord = parts.pop();
        const rest = parts.join(' ');
        return <>{rest} <em>{lastWord}</em></>;
    })();

    return (
        <>
            {/* === SPIDER-VERSE SVG DISTORTION FILTER === */}
            <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }} aria-hidden="true">
                <filter id="spider-glitch" x="-20%" y="-20%" width="140%" height="140%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.02 0.8" numOctaves="2" result="warp" />
                    <feDisplacementMap in="SourceGraphic" in2="warp" scale="30" xChannelSelector="R" yChannelSelector="G" />
                </filter>
            </svg>

            <div className="noise-overlay" />

            <div id="flash" ref={flashEl} style={{ opacity: 0 }} />

            <div id="flying-name" ref={flyingEl} style={{ display: 'none' }}>
                {formattedNameNoCursor}
            </div>

            <div id="intro" ref={introPanelEl}>
                <div
                    id="intro-name-wrap"
                    ref={introWrapEl}
                >
                    <div id="intro-name" ref={introNameEl}>
                        {formattedName}
                    </div>
                </div>
            </div>
        </>
    );
}