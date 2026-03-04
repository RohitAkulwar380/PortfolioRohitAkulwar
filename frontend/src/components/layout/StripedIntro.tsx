/*
 * components/layout/StripedIntro.tsx
 * ────────────────────────────────────
 * A retro-styled stacking text animation using SVG and GSAP.
 * Randomly selected alternative to the main IntroOverlay.
 */

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import './StripedIntro.css';

interface StripedIntroProps {
    name: string;
    onComplete: () => void;
}

const STRIPE_COLORS = ['#1A2744', '#3A8C82', '#E8A832', '#E05A3A'];
const OUTLINE_COLORS = ['#E05A3A', '#E8A832', '#3A8C82', '#1A2744', '#C0583A', '#5AADA6'];

export default function StripedIntro({ name, onComplete }: StripedIntroProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const timelineRef = useRef<gsap.core.Timeline | null>(null);

    useEffect(() => {
        if (!svgRef.current) return;

        const svg = svgRef.current;
        const W = window.innerWidth;
        const H = window.innerHeight;
        const activeFont = "'Righteous', sans-serif";

        // ─── Helpers ─────────────────────────────────────────────────────────

        const computeFontSize = (text: string) => {
            // Create a probe to measure text width
            const probe = document.createElementNS("http://www.w3.org/2000/svg", "text");
            probe.textContent = text.toUpperCase();
            probe.style.cssText = `font-family:${activeFont};font-size:100px;font-weight:900;letter-spacing:0.01em;`;
            probe.setAttribute("visibility", "hidden");
            svg.appendChild(probe);

            const bbox = probe.getBBox();
            const w100 = bbox.width;
            const h100 = bbox.height;
            svg.removeChild(probe);

            // Scale so text fits width with margin, OR height (5 rows)
            const byWidth = (W / w100) * 100 * 0.90; // 90% width
            const byHeight = (H / (h100 * 0.88 * 5)) * 100;
            return Math.min(byWidth, byHeight);
        };

        const textCSS = (fontSize: number, extra = '') => {
            return `font-family:${activeFont};font-size:${fontSize}px;font-weight:900;` +
                `text-anchor:middle;dominant-baseline:central;` +
                `text-transform:uppercase;letter-spacing:0.01em;${extra}`;
        };

        const buildStripeGroup = (clipId: string, refText: SVGTextElement, fontSize: number) => {
            const frag = document.createDocumentFragment();
            const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

            // Create clipPath from text
            const clip = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
            clip.setAttribute("id", clipId);
            const textClone = refText.cloneNode(true);
            clip.appendChild(textClone);
            defs.appendChild(clip);

            // Create Stripes
            const nColors = STRIPE_COLORS.length;
            const bandH = fontSize * 0.22;
            const gapH = fontSize * 0.03;
            const cycleH = (bandH + gapH) * nColors;
            const cycles = Math.ceil(H / cycleH) + 2;
            const startY = -cycleH;

            const stripeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            stripeGroup.setAttribute("clip-path", `url(#${clipId})`);

            for (let c = 0; c < cycles; c++) {
                for (let ci = 0; ci < nColors; ci++) {
                    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                    const y = startY + c * cycleH + ci * (bandH + gapH);
                    rect.setAttribute("x", "0");
                    rect.setAttribute("y", y.toString());
                    rect.setAttribute("width", W.toString());
                    rect.setAttribute("height", bandH.toString());
                    rect.setAttribute("fill", STRIPE_COLORS[ci]);
                    stripeGroup.appendChild(rect);
                }
            }

            frag.appendChild(defs);
            frag.appendChild(stripeGroup);
            return frag;
        };

        // ─── Build Scene ─────────────────────────────────────────────────────

        // Clear previous
        while (svg.firstChild) {
            svg.removeChild(svg.firstChild);
        }

        const fontSize = computeFontSize(name);
        const lineHeight = fontSize * 0.88;
        const totalRows = 5;
        const totalStackH = (totalRows - 1) * lineHeight;
        const startY = (H + totalStackH) / 2;

        const wrappers: { el: SVGGElement, index: number }[] = [];

        for (let i = 0; i < totalRows; i++) {
            const yPos = startY - i * lineHeight;
            const wrap = document.createElementNS("http://www.w3.org/2000/svg", "g");

            if (i === 0) {
                // Base Row: Ink fill + Stripes
                const inkText = document.createElementNS("http://www.w3.org/2000/svg", "text");
                inkText.textContent = name.toUpperCase();
                inkText.setAttribute("x", "50%");
                inkText.setAttribute("y", yPos.toString());
                inkText.style.cssText = textCSS(fontSize, 'fill:#1A2744;');
                wrap.appendChild(inkText);

                const refText = document.createElementNS("http://www.w3.org/2000/svg", "text");
                refText.textContent = name.toUpperCase();
                refText.setAttribute("x", "50%");
                refText.setAttribute("y", yPos.toString());
                refText.style.cssText = textCSS(fontSize, 'fill:black;');

                const stripeFrag = buildStripeGroup(`clip-row-${Math.random().toString(36).substr(2, 9)}`, refText, fontSize);
                wrap.appendChild(stripeFrag);
            } else {
                // Ghost Rows
                const colorIndex = (i - 1) % OUTLINE_COLORS.length;
                const strokeW = Math.max(1.5, fontSize * 0.008);
                const ghost = document.createElementNS("http://www.w3.org/2000/svg", "text");
                ghost.textContent = name.toUpperCase();
                ghost.setAttribute("x", "50%");
                ghost.setAttribute("y", yPos.toString());
                ghost.style.cssText = textCSS(fontSize,
                    `fill:transparent;stroke:${OUTLINE_COLORS[colorIndex]};stroke-width:${strokeW}px;`);
                wrap.appendChild(ghost);
            }

            gsap.set(wrap, { opacity: 0, y: i * lineHeight, transformOrigin: "50% 50%" });
            svg.appendChild(wrap);
            wrappers.push({ el: wrap, index: i });
        }

        // ─── Animation Timeline ──────────────────────────────────────────────

        timelineRef.current = gsap.timeline({
            onComplete: () => {
                // After stack is complete, fade out nicely and signal App
                gsap.to(containerRef.current, {
                    opacity: 0,
                    duration: 0.5,
                    delay: 0.5, // Let the user see the full stack for a moment
                    onComplete: () => {
                        onComplete();
                    }
                });
            }
        });

        wrappers.forEach(({ el, index }) => {
            timelineRef.current?.to(el, {
                opacity: 1,
                y: 0,
                duration: 1.05,
                ease: "expo.out"
            }, index * 0.055);
        });

        return () => {
            timelineRef.current?.kill();
        };
    }, [name, onComplete]);

    return (
        <div className="striped-intro-container" ref={containerRef}>
            <svg id="striped-svg-canvas" ref={svgRef} xmlns="http://www.w3.org/2000/svg"></svg>
        </div>
    );
}