/**
 * ThemeTransition.tsx — v3: end-of-reel roll with 3 stacked frames
 */

import { useEffect, useState } from 'react';
import './ThemeTransition.css';

interface Props {
    name: string;
}

export default function ThemeTransition({ name }: Props) {
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        // Start the smooth fade-out at 3800ms — 700ms before ThemeContext unmounts at 4500ms
        const t = setTimeout(() => setExiting(true), 3800);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className={`film-transition-overlay${exiting ? ' exiting' : ''}`} aria-hidden="true">
            <div className="ft-screen">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 1920 1080"
                    preserveAspectRatio="xMidYMid slice"
                >
                    <defs>
                        <radialGradient id="ft-vignette" cx="50%" cy="50%" r="75%">
                            <stop offset="30%" stopColor="transparent" />
                            <stop offset="85%" stopColor="#4a3520" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="#120c06" stopOpacity="0.95" />
                        </radialGradient>

                        <filter id="ft-grain">
                            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" result="noise" />
                            <feColorMatrix
                                type="matrix"
                                values="1 0 0 0 0  0 0.9 0 0 0  0 0.8 0 0 0  0 0 0 0.4 0"
                                in="noise" result="coloredNoise"
                            />
                        </filter>

                        <filter id="ft-ink-bleed" x="-20%" y="-20%" width="140%" height="140%">
                            <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" result="noise" />
                            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
                            <feGaussianBlur stdDeviation="0.8" result="blurred" />
                            <feMerge>
                                <feMergeNode in="blurred" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>

                        <filter id="ft-projector-blur">
                            <feGaussianBlur stdDeviation="0.5">
                                <animate attributeName="stdDeviation" values="0.2; 1.5; 0.2; 2.5; 0.2"
                                    dur="5s" calcMode="discrete" repeatCount="indefinite" />
                            </feGaussianBlur>
                        </filter>
                    </defs>

                    <g className="ft-flicker">
                        {/* Aged paper base */}
                        <rect width="100%" height="100%" fill="#e0cbb3" />

                        <g className="ft-gate-weave" filter="url(#ft-projector-blur)">
                            <g className="ft-film-slip">

                                {/* ── Film frame divider bars between repeating frames ── */}
                                <rect x="-100" y="-1080" width="2120" height="30" fill="#050302" opacity="0.85" />
                                <rect x="-100" y="0" width="2120" height="30" fill="#050302" opacity="0.85" />
                                <rect x="-100" y="1080" width="2120" height="30" fill="#050302" opacity="0.85" />
                                <rect x="-100" y="2160" width="2120" height="30" fill="#050302" opacity="0.85" />

                                {/* TOP FRAME — visible when reel rolls down */}
                                <text x="965" y="-535" textAnchor="middle" dominantBaseline="middle"
                                    className="ft-text-style ft-font-glitch" fill="#000" opacity="0.15"
                                    filter="url(#ft-ink-bleed)">{name}</text>
                                <text x="960" y="-540" textAnchor="middle" dominantBaseline="middle"
                                    className="ft-text-style ft-font-glitch"
                                    filter="url(#ft-ink-bleed)">{name}</text>

                                {/* CENTER FRAME — main visible frame */}
                                <text x="965" y="545" textAnchor="middle" dominantBaseline="middle"
                                    className="ft-text-style ft-font-glitch" fill="#000" opacity="0.15"
                                    filter="url(#ft-ink-bleed)">{name}</text>
                                <text x="960" y="540" textAnchor="middle" dominantBaseline="middle"
                                    className="ft-text-style ft-font-glitch"
                                    filter="url(#ft-ink-bleed)">{name}</text>

                                {/* BOTTOM FRAME — visible when reel rolls up */}
                                <text x="965" y="1625" textAnchor="middle" dominantBaseline="middle"
                                    className="ft-text-style ft-font-glitch" fill="#000" opacity="0.15"
                                    filter="url(#ft-ink-bleed)">{name}</text>
                                <text x="960" y="1620" textAnchor="middle" dominantBaseline="middle"
                                    className="ft-text-style ft-font-glitch"
                                    filter="url(#ft-ink-bleed)">{name}</text>

                            </g>
                        </g>

                        {/* Scratches */}
                        <g>
                            <line x1="15%" y1="0" x2="15%" y2="1080" className="ft-scratch" style={{ animationDuration: '2.1s', animationDelay: '0.2s' }} />
                            <line x1="30%" y1="0" x2="30%" y2="1080" className="ft-scratch" style={{ animationDuration: '3.7s', animationDelay: '1.5s', strokeWidth: 1.5 }} />
                            <line x1="78%" y1="0" x2="78%" y2="1080" className="ft-scratch" style={{ animationDuration: '1.6s', animationDelay: '0.8s' }} />
                            <line x1="92%" y1="0" x2="92%" y2="1080" className="ft-scratch" style={{ animationDuration: '4.2s', animationDelay: '0.1s', strokeWidth: 3.5, stroke: '#120c06' }} />
                            <line x1="0" y1="15%" x2="100%" y2="15%" stroke="#120c06" strokeWidth="3" opacity="0">
                                <animate attributeName="opacity" values="0; 0; 0.3; 0; 0" keyTimes="0; 0.94; 0.95; 0.96; 1" dur="4s" calcMode="discrete" repeatCount="indefinite" />
                                <animate attributeName="y1" values="10%; 80%; 20%; 90%" calcMode="discrete" dur="4s" repeatCount="indefinite" />
                                <animate attributeName="y2" values="10%; 80%; 20%; 90%" calcMode="discrete" dur="4s" repeatCount="indefinite" />
                            </line>
                        </g>

                        {/* Film grain */}
                        <svg x="-10%" y="-10%" width="120%" height="120%">
                            <rect width="100%" height="100%" filter="url(#ft-grain)" opacity="0.45"
                                className="ft-moving-grain" pointerEvents="none"
                                style={{ mixBlendMode: 'multiply' }} />
                        </svg>

                        {/* Vignette */}
                        <rect width="100%" height="100%" fill="url(#ft-vignette)" pointerEvents="none" style={{ mixBlendMode: 'multiply' }} />

                        {/* Splice flashes — synced to the 4s end-of-reel window */}
                        <rect width="100%" height="100%" fill="#fff" opacity="0" pointerEvents="none">
                            <animate
                                attributeName="opacity"
                                values="0; 0; 0.3; 0; 0; 0.4; 0; 0.5; 0; 0.2; 0"
                                keyTimes="0; 0.35; 0.36; 0.38; 0.67; 0.70; 0.75; 0.82; 0.88; 0.94; 1"
                                dur="4s" calcMode="discrete" repeatCount="indefinite"
                            />
                        </rect>

                        {/* Sepia cast */}
                        <rect width="100%" height="100%" fill="#d2a679" opacity="0.15" pointerEvents="none" style={{ mixBlendMode: 'color' }} />
                    </g>
                </svg>
            </div>
        </div>
    );
}
