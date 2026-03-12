import React, { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import type { ResumeData } from '../../types';
import { useChat } from '../../hooks/useChat';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeSwitcher from '../renaissance/ThemeSwitcher';
import './ArchitecturalTheme.css';

gsap.registerPlugin(ScrollTrigger);

interface Props {
    resume: ResumeData;
}

// ──────────────────────────────────────────────
// Project Card with Hover Video & Progress SVG
// ──────────────────────────────────────────────
const ArchitecturalProjectCard = ({ proj, index, onKeywordClick }: { proj: any; index: number; onKeywordClick: (text: string, element: HTMLElement, color: string) => void }) => {
    const itemRef = useRef<HTMLDivElement>(null);
    const videoWrapRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const rectRef = useRef<SVGRectElement>(null);
    const rafId = useRef<number>(0);
    const isHovered = useRef(false);
    const isExpanded = useRef(false);

    const localVideoMap: Record<string, string> = {
        "Automated Data Analytics Pipeline using n8n": "/videos/AutomatedDataAnalyticsPipelineUsingn8n.mp4",
        "AI Content Aggregation & Automation Pipeline": "/videos/AIContentAggregationAutomationPipeline.mp4",
        "2D Game in Python - Pixel Fire": "/videos/2DPythonGame.mp4",
        "Full Stack E-commerce Website": "/videos/FullStack.mp4"
    };
    const videoSrc = proj.videoUrl || localVideoMap[proj.title] || "";
    // Modern specific hardcoded projColors if needed, but architectural used dynamic palette? No, architectural used pi-c0/1/2 etc.
    const projColors = ['#ccd8ff', '#f0c898', '#a8d4c0', '#d6d0c8'];
    const pColor = projColors[index % 4];

    useEffect(() => {
        const item = itemRef.current;
        const videoWrap = videoWrapRef.current;
        const video = videoRef.current;
        const rect = rectRef.current;

        if (!item || !videoWrap || !video || !rect) return;

        // Hover Scroll Teaser (Entrance flicker to signify video presence)
        ScrollTrigger.create({
            trigger: item,
            start: "top 65%",
            onEnter: () => {
                if (isHovered.current || isExpanded.current) return;
                video.play().catch(e => console.warn("Autoplay prevented:", e));

                const tl = gsap.timeline({
                    onComplete: () => {
                        if (!isHovered.current && !isExpanded.current) {
                            video.pause();
                            video.currentTime = 0;
                        }
                    }
                });

                tl.to(videoWrap, { opacity: 0.8, duration: 0.15, ease: "power2.out" })
                    .to(video, { scale: 1.02, duration: 0.15, ease: "power2.out" }, "<")
                    .to(videoWrap, { opacity: 0, duration: 0.4, ease: "power2.in", delay: 0.25 })
                    .to(video, { scale: 1.1, duration: 0.4, ease: "power2.in" }, "<");
            }
        });

        return () => {
            // Cleanup ScrollTrigger created inside this card component
            ScrollTrigger.getAll().forEach(st => {
                if (st.trigger === item) st.kill();
            });
            cancelAnimationFrame(rafId.current);
        };
    }, []);

    const updateProgress = () => {
        const video = videoRef.current;
        const rect = rectRef.current;
        if (video && rect && video.duration) {
            const progress = video.currentTime / video.duration;
            rect.style.strokeDashoffset = String(100 - (progress * 100));
        }
        rafId.current = requestAnimationFrame(updateProgress);
    };

    const handleMouseEnter = () => {
        const videoWrap = videoWrapRef.current;
        const video = videoRef.current;
        const rect = rectRef.current;
        if (!video || !videoWrap || !rect || isExpanded.current) return;

        isHovered.current = true;
        gsap.killTweensOf(videoWrap);
        gsap.killTweensOf(video);

        video.play().catch(e => console.warn(e));
        updateProgress();

        gsap.to(videoWrap, { opacity: 1, duration: 0.4, ease: "power2.out", overwrite: true });
        gsap.to(video, { scale: 1, duration: 0.6, ease: "power2.out", overwrite: true });
    };

    const handleMouseLeave = () => {
        const videoWrap = videoWrapRef.current;
        const video = videoRef.current;
        const rect = rectRef.current;
        if (!video || !videoWrap || !rect || isExpanded.current) return;

        isHovered.current = false;
        video.pause();
        cancelAnimationFrame(rafId.current);

        gsap.to(videoWrap, { opacity: 0, duration: 0.4, ease: "power2.in", overwrite: true });
        gsap.to(video, { scale: 1.1, duration: 0.4, ease: "power2.in", overwrite: true });
        gsap.to(rect, { strokeDashoffset: 100, duration: 0.5, ease: "power2.out", overwrite: true });

        setTimeout(() => { if (!isHovered.current && !isExpanded.current) video.currentTime = 0; }, 500);
    };

    const handleExpandCard = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const item = itemRef.current;
        const videoWrap = videoWrapRef.current;
        const video = videoRef.current;
        if (!item || !videoWrap || !video || isExpanded.current) return;

        isExpanded.current = true;

        const originContainer = item.querySelector('.pi-color') as HTMLElement;
        const bounds = videoWrap.getBoundingClientRect();

        // 1. Yank element out of DOM to bypass overflow:hidden nesting, directly to body
        // Ensure it stays inside the architectural root to inherit scoped CSS styles like width/height
        const rootContainer = item.closest('.architectural-root') || document.body;
        rootContainer.appendChild(videoWrap);

        gsap.set(videoWrap, {
            position: 'fixed',
            top: bounds.top,
            left: bounds.left,
            width: bounds.width,
            height: bounds.height,
            zIndex: 10000,
            pointerEvents: 'auto',
            opacity: 1
        });

        // 2. Enable Video Trimmings
        // Only unmute if it's the 3rd video or later!
        video.muted = index < 2;
        video.controls = true;

        const overlay = document.getElementById('video-lightbox-overlay');
        const closeBtn = document.getElementById('lightbox-close');
        if (overlay && closeBtn) {
            gsap.to(overlay, { opacity: 1, duration: 0.4, pointerEvents: 'auto' });
        }

        // 3. FLIP animate to fullscreen center
        gsap.to(videoWrap, {
            top: "10vh",
            left: "10vw",
            width: "80vw",
            height: "80vh",
            borderRadius: "16px",
            boxShadow: "0 40px 100px rgba(0,0,0,0.8)",
            duration: 0.8,
            ease: "expo.out"
        });

        // Also restore video's native color and scale for comfortable viewing
        gsap.to(video, {
            scale: 1,
            opacity: 1,
            mixBlendMode: 'normal',
            duration: 0.8,
            ease: "expo.out"
        });

        // Closure for cleanup
        const closeLightbox = () => {
            if (!isExpanded.current) return;
            video.muted = true;
            video.controls = false;

            if (overlay) {
                gsap.to(overlay, { opacity: 0, duration: 0.4, pointerEvents: 'none' });
            }

            // Recalculate target bounds instantly before flying back, user could have scrolled!
            const targetBounds = originContainer.getBoundingClientRect();

            gsap.to(videoWrap, {
                top: targetBounds.top,
                left: targetBounds.left,
                width: targetBounds.width,
                height: targetBounds.height,
                borderRadius: "0px",
                boxShadow: "none",
                duration: 0.6,
                ease: "expo.inOut",
                onComplete: () => {
                    isExpanded.current = false;

                    // Cleanly place back into React component flow tree
                    gsap.set(videoWrap, {
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        width: '100%', height: '100%',
                        zIndex: 0, pointerEvents: 'none'
                    });
                    originContainer.insertBefore(videoWrap, originContainer.firstChild);

                    // Re-evaluate mouse position
                    if (!isHovered.current) {
                        gsap.to(videoWrap, { opacity: 0, duration: 0.4 });
                        video.pause();
                    }
                }
            });

            // Revert video styling back to its card appearance
            gsap.to(video, {
                scale: 1.1,
                opacity: 0.6,
                mixBlendMode: 'luminosity',
                duration: 0.6,
                ease: "expo.inOut"
            });

            // Detach listeners so they don't pile up!
            closeBtn?.removeEventListener('click', btnClickHandler);
            overlay?.removeEventListener('click', overlayClickHandler);
        };

        const btnClickHandler = (ev: Event) => {
            ev.preventDefault();
            ev.stopPropagation();
            closeLightbox();
        };

        const overlayClickHandler = (ev: MouseEvent) => {
            // Only close if clicking directly on the overlay backdrop (not the video or controls)
            if (ev.target === overlay || ev.target === closeBtn) {
                ev.preventDefault();
                ev.stopPropagation();
                closeLightbox();
            }
        };

        // Attach!
        closeBtn?.addEventListener('click', btnClickHandler);
        overlay?.addEventListener('click', overlayClickHandler);
    };

    const highlightKeywords = (text: string) => {
        // Terms to highlight from both original HTML and current resume data
        const keywords = [
            "n8n", "Gemini API", "automation pipeline",
            "RSS feeds", "NLP-based classification",
            "Python", "PyGame", "2D Indie Platformer",
            "MERN stack", "TypeScript", "Neo-Brutalist UI",
            "full-stack", "AI systems", "React", "FastAPI",
            "LangGraph multi-agent chatbot", "CORS-hardened FastAPI",
            "flashcards, quizzes, and RAG chat", "LLaMA 3.1 8B",
            "Multi-workflow n8n system", "full-stack Postgres dashboard"
        ];

        let parts: (string | React.ReactNode)[] = [text];

        keywords.forEach(kw => {
            const nextParts: (string | React.ReactNode)[] = [];
            parts.forEach(part => {
                if (typeof part !== 'string') {
                    nextParts.push(part);
                    return;
                }

                const regex = new RegExp(`(${kw})`, 'gi');
                const segments = part.split(regex);
                segments.forEach((seg, i) => {
                    if (seg.toLowerCase() === kw.toLowerCase()) {
                        nextParts.push(
                            <span
                                key={`${seg}-${i}`}
                                className="kw-ul"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onKeywordClick(seg, e.currentTarget, pColor);
                                }}
                            >
                                {seg}
                            </span>
                        );
                    } else if (seg) {
                        nextParts.push(seg);
                    }
                });
            });
            parts = nextParts;
        });

        return parts;
    };

    return (
        <div ref={itemRef} className="proj-item" style={{ '--proj-color': pColor } as React.CSSProperties} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <div className={`pi-color pi-c${index % 4}`}>

                {/* Video Underlay */}
                {videoSrc && (
                    <div ref={videoWrapRef} className="pi-video-wrap">
                        <video ref={videoRef} src={videoSrc} muted playsInline loop />
                    </div>
                )}

                {videoSrc && (
                    <button className="pi-expand-btn" onClick={handleExpandCard}>Expand ↗</button>
                )}

                {/* Progress Glowing SVG Border */}
                <svg className="pi-progress-svg" preserveAspectRatio="none">
                    <rect ref={rectRef} className="pi-progress-rect" x="2" y="2" width="calc(100% - 4px)" height="calc(100% - 4px)" pathLength="100"></rect>
                </svg>

                <div className="pi-num">{(index + 1).toString().padStart(2, '0')}</div>
                <div className="pi-title-big">
                    {proj.title.split(' ').map((word: string, wi: number) => (
                        <div key={wi}>{word}</div>
                    ))}
                </div>
            </div>
            <div className="pi-body">
                <div className="pi-cat">Selected Project</div>
                <p className="pi-desc">{highlightKeywords(proj.description)}</p>
                <div className="pi-pills">
                    {proj.technologies.map((tech: string) => (
                        <span key={tech} className="pi-pill">{tech}</span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default function ArchitecturalTheme({ resume }: Props) {
    const { switchTheme } = useTheme();
    const containerRef = useRef<HTMLDivElement>(null);
    const cursorRef = useRef<HTMLDivElement>(null);
    const introRef = useRef<HTMLDivElement>(null);
    const catalogueRef = useRef<HTMLDivElement>(null);
    const lenisRef = useRef<any>(null);
    // true while cards are edge-on waiting for React to commit new content
    const isFlippingRef = useRef<boolean>(false);

    const [activeTab, setActiveTab] = useState<'technical' | 'soft'>('technical');
    const [renderedTab, setRenderedTab] = useState<'technical' | 'soft'>('technical');
    const [isHeroDark, setIsHeroDark] = useState<boolean>(true);

    const [isChatBarVisible, setIsChatBarVisible] = useState<boolean>(false);
    const [isChatBarHovered, setIsChatBarHovered] = useState<boolean>(false);
    const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
    const [isChatExpanded, setIsChatExpanded] = useState<boolean>(false);
    const [chatText, setChatText] = useState('');

    const scrollTimeout = useRef<number | null>(null);
    const chatBottomRef = useRef<HTMLDivElement>(null);
    const chatWindowRef = useRef<HTMLDivElement>(null);
    const chatBarRef = useRef<HTMLDivElement>(null);

    const { messages, isLoading, sendMessage } = useChat();

    // Auto-scroll chat to bottom logic
    useEffect(() => {
        if (isChatOpen) {
            chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoading, isChatOpen]);

    // Fires after React has committed the new skill names into the DOM.
    // At this point cards are still edge-on (rotationX:90) — we flip them
    // back down and re-trigger the stripe sweep on the now-stable nodes.
    useEffect(() => {
        if (!isFlippingRef.current) return; // skip initial mount
        isFlippingRef.current = false;

        const items = catalogueRef.current?.querySelectorAll('.sc-item');
        if (!items || items.length === 0) return;

        items.forEach((item, index) => {
            // Strip any leftover stripe animation so it restarts cleanly
            item.classList.remove('stripes-in');
            void (item as HTMLElement).offsetWidth; // force reflow

            gsap.fromTo(item,
                { rotationX: -90 },
                {
                    rotationX: 0,
                    duration: 0.25,
                    ease: 'power2.out',
                    delay: index * 0.04,
                    clearProps: 'transform',
                    onComplete: () => {
                        item.classList.add('stripes-in');
                    }
                }
            );
        });
    }, [renderedTab]); // runs exactly once per tab switch, after DOM commit

    function handleChatKey(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter' && chatText.trim() && !isLoading) {
            sendMessage(chatText.trim());
            setChatText('');
        }
    }

    // Initial GSAP configuration (runs once)
    useEffect(() => {
        const win = chatWindowRef.current;
        if (win) {
            gsap.set(win, { yPercent: 100 });
        }
    }, []);

    // Chat Window GSAP Animations
    useEffect(() => {
        const win = chatWindowRef.current;
        const bar = chatBarRef.current;
        if (!win) return;

        if (isChatOpen) {
            win.style.pointerEvents = 'auto'; // Re-enable clicks inside chat
            gsap.to(win, { yPercent: 0, duration: 0.8, ease: "expo.out" });
            if (bar) bar.style.pointerEvents = 'none';
            if (isChatExpanded) {
                gsap.to(win, { height: "100vh", maxHeight: "100vh", duration: 0.8, ease: "expo.inOut" });
            } else {
                gsap.to(win, { height: "65vh", maxHeight: "600px", duration: 0.8, ease: "expo.inOut" });
            }
        } else {
            // Close animation
            if (isChatExpanded) setIsChatExpanded(false); // reset expand state
            gsap.to(win, {
                yPercent: 100,
                duration: 0.6,
                ease: "expo.inOut",
                onComplete: () => {
                    win.style.pointerEvents = 'none'; // Disable hits when hidden
                    if (bar) bar.style.pointerEvents = 'auto';
                }
            });
        }
    }, [isChatOpen, isChatExpanded]);

    // Apply strict isolation (scroll priority) to the entire chat window
    useEffect(() => {
        const win = chatWindowRef.current;
        if (!win) return;

        const stopScroll = (e: Event) => {
            e.stopPropagation();
        };

        // Must act on the native capture phase to beat Lenis/GSAP
        win.addEventListener('wheel', stopScroll, { passive: false });
        win.addEventListener('touchmove', stopScroll, { passive: false });

        return () => {
            win.removeEventListener('wheel', stopScroll);
            win.removeEventListener('touchmove', stopScroll);
        };
    }, []);

    // Generic Fly Animation Helper
    function triggerFlyAnimation(element: HTMLElement, qText: string, color: string, isKeyword = false) {
        if (element.classList.contains('animating') || isLoading) return;
        element.classList.add('animating');

        const rect = element.getBoundingClientRect();

        let clone: HTMLElement;
        if (isKeyword) {
            // Keywords need to become a solid "chip"
            clone = document.createElement('div');
            clone.innerText = element.innerText;
            const computedStyle = window.getComputedStyle(element);

            gsap.set(clone, {
                position: 'fixed',
                top: rect.top,
                left: rect.left,
                margin: 0,
                zIndex: 10000,
                boxSizing: 'border-box',
                fontFamily: computedStyle.fontFamily,
                fontSize: computedStyle.fontSize,
                fontWeight: computedStyle.fontWeight,
                fontStyle: computedStyle.fontStyle,
                color: '#fff',
                background: 'var(--ink)',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.2rem 0.6rem',
                borderRadius: '4px'
            });

            if (containerRef.current) {
                containerRef.current.appendChild(clone);
            } else {
                document.body.appendChild(clone);
            }

            // Recalculate physical dimensions after adding structural padding
            const cloneRect = clone.getBoundingClientRect();
            gsap.set(clone, {
                top: rect.top - (cloneRect.height - rect.height) / 2,
                left: rect.left - (cloneRect.width - rect.width) / 2
            });
        } else {
            // Full card clone
            clone = element.cloneNode(true) as HTMLDivElement;
            if (containerRef.current) {
                containerRef.current.appendChild(clone);
            } else {
                document.body.appendChild(clone);
            }

            gsap.set(clone, {
                position: 'fixed',
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                margin: 0,
                zIndex: 10000,
                boxSizing: 'border-box'
            });
        }

        const currentRect = clone.getBoundingClientRect();
        const perimeter = (currentRect.width + currentRect.height) * 2;
        const svgHTML = `
            <svg width="${currentRect.width + 20}" height="${currentRect.height + 20}" style="position:absolute; top:-10px; left:-10px; z-index:10; pointer-events:none; overflow:visible;">
                <rect x="10" y="10" width="${currentRect.width}" height="${currentRect.height}" fill="none" 
                      stroke="${color}" stroke-width="${isKeyword ? 4 : 6}" stroke-linecap="round"
                      stroke-dasharray="0 ${perimeter + 100}" 
                      stroke-dashoffset="0" 
                      style="filter: drop-shadow(0 0 8px ${color}) ${!isKeyword ? `drop-shadow(0 0 16px ${color})` : ''};"
                      class="glowing-streak-rect" />
            </svg>
        `;
        clone.insertAdjacentHTML('beforeend', svgHTML);

        gsap.to(element, { opacity: 0, duration: 0.2 });

        const glowObj = { len: 0 };
        const tl = gsap.timeline({
            onComplete: () => {
                clone.remove();
                gsap.to(element, { opacity: 1, duration: 1, delay: 1 });
                element.classList.remove('animating');

                // Auto open chat and submit query
                setIsChatOpen(true);
                sendMessage(qText);
            }
        });

        tl.to(clone, {
            top: "40%",
            left: "50%",
            xPercent: -50,
            yPercent: -50,
            scale: isKeyword ? 1.5 : 1.35,
            boxShadow: `0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.1)`,
            duration: 0.8,
            ease: "elastic.out(1, 0.6)"
        })
            .to(glowObj, {
                len: perimeter,
                duration: 1.1,
                ease: "power2.inOut",
                onUpdate: () => {
                    const rectEl = clone.querySelector('.glowing-streak-rect');
                    if (rectEl) {
                        rectEl.setAttribute('stroke-dasharray', `${glowObj.len} ${perimeter + 100}`);
                    }
                }
            }, "-=0.4")
            .to(clone, {
                top: "100%",
                scale: 0.2,
                opacity: 0,
                duration: 0.45,
                ease: "expo.in"
            }, "+=0.1");

        tl.call(() => {
            setIsChatBarVisible(true);
            setIsChatOpen(true);
        }, undefined, "-=0.2");
    }

    // Hero Falling Cards Interaction (Growing Streak to Chat)
    function handleCardClick(e: React.MouseEvent<HTMLDivElement>, qText: string) {
        const card = e.currentTarget;
        const computedStyle = window.getComputedStyle(card);
        const cardBgColor = computedStyle.backgroundColor;
        triggerFlyAnimation(card, qText, cardBgColor, false);
    }

    function handleKeywordClick(text: string, element: HTMLElement, color: string) {
        const qText = `Tell me more about ${text} in this project.`;
        triggerFlyAnimation(element, qText, color, true);
    }

    // Helpers for dynamic visual elements
    const nameParts = resume.personal.name ? resume.personal.name.split(' ') : ['A', 'B'];
    const giantLetter = nameParts[0] ? nameParts[0][0].toUpperCase() : 'R';

    // Switch active skills based on the current rendered tab to allow decoupled GSAP dom manipulation
    const currentSkills = renderedTab === 'technical'
        ? (resume.skills.technical || []).slice(0, 6)
        : (resume.skills.soft || []).slice(0, 6);

    const getAbbr = (skill: string) => {
        const words = skill.trim().split(/[\s\-]+/);
        if (words.length > 1) {
            return (words[0][0] + words[1][0]).toUpperCase().substring(0, 2);
        }
        return skill.substring(0, 2).toUpperCase();
    };
    const palette = ['#1f3a8f', '#5c3a1e', '#2d4a3e', '#4a1e3a', '#3a3a1e', '#1e3a4a'];
    const initials = nameParts.map(n => n[0]).join('.') + '.';

    const handleTabChange = (tab: 'technical' | 'soft') => {
        if (tab === activeTab) return;

        setActiveTab(tab);

        const items = catalogueRef.current?.querySelectorAll('.sc-item');

        if (items && items.length > 0) {
            // Stop any in-progress stripe animations immediately
            items.forEach(item => {
                item.classList.remove('stripes-in');
                void (item as HTMLElement).offsetWidth;
            });

            // Flip all cards edge-on (invisible), staggered
            items.forEach((item, index) => {
                gsap.to(item, {
                    rotationX: 90,
                    duration: 0.15,
                    ease: 'power1.in',
                    delay: index * 0.04,
                });
            });

            // Wait until the last card is edge-on, then update React state.
            // The useEffect watching renderedTab will fire after React commits
            // the new content into the still-invisible nodes, then flip back.
            const edgeOnMs = ((items.length - 1) * 0.04 + 0.15 + 0.02) * 1000;
            setTimeout(() => {
                isFlippingRef.current = true;
                setRenderedTab(tab);
            }, edgeOnMs);

        } else {
            setRenderedTab(tab);
        }
    };

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, target: string) => {
        e.preventDefault();
        if (lenisRef.current) {
            lenisRef.current.scrollTo(target);
        } else {
            document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        // Enforce global layout resets
        document.documentElement.classList.add('theme-architectural-active');
        document.body.classList.add('theme-architectural-active');
        document.body.classList.add('noscroll-architectural');

        // 1. Initialize Lenis Smooth Scroll
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            wheelMultiplier: 1,
        });
        lenisRef.current = lenis;

        // Chat UI Visibility Logic (Lenis level)
        lenis.on('scroll', () => {
            const scrollY = window.scrollY;

            // Find the footer (s4) to know when to hide the bar
            const footer = document.querySelector('.s4');
            const footerTop = footer ? (footer as HTMLElement).offsetTop : Infinity;
            const windowBottom = scrollY + window.innerHeight;

            // Only trigger visibility logic past the hero section (approx 90vh)
            // AND hide it when approaching the footer (about 100px before reaching it)
            if (scrollY > window.innerHeight * 0.9 && windowBottom < footerTop + 100) {
                setIsChatBarVisible(true);

                if (scrollTimeout.current) {
                    window.clearTimeout(scrollTimeout.current);
                }

                scrollTimeout.current = window.setTimeout(() => {
                    setIsChatBarVisible(false);
                }, 5000);
            } else {
                setIsChatBarVisible(false);
            }
        });

        const tickerFn = (time: number) => {
            lenis.raf(time * 1000);
        };
        gsap.ticker.add(tickerFn);
        gsap.ticker.lagSmoothing(0, 0);

        // 2. Custom Cursor Logic scoped to container
        const cur = cursorRef.current;
        let mx = 0, my = 0;

        const onMouseMove = (e: MouseEvent) => {
            mx = e.clientX;
            my = e.clientY;
            if (cur) {
                gsap.to(cur, { x: mx, y: my, duration: 0.15, ease: "power2.out" });

                // Detect light sections for cursor inversion safely
                const el = document.elementFromPoint(mx, my);
                if (el && containerRef.current) {
                    const s0 = containerRef.current.querySelector('.s0');
                    const s2 = containerRef.current.querySelector('.s2');
                    const s3 = containerRef.current.querySelector('.s3');

                    let onLight = false;

                    if (s0 && s0.contains(el)) {
                        onLight = !s0.classList.contains('dark-mode');
                    } else if ((s2 && s2.contains(el)) || (s3 && s3.contains(el))) {
                        onLight = true;
                    }

                    // Specific interactive overrides
                    if (el.closest('.h-card.cc-0') || el.closest('.h-card.cc-1') ||
                        el.closest('.h-card.cc-2') || el.closest('.h-card.cc-3')) {
                        onLight = true;
                    }
                    if (el.closest('.h-card.cc-4') || el.closest('#architectural-chat-bar')) {
                        onLight = false;
                    }
                    if (el.closest('#architectural-chat-window') || el.closest('#video-lightbox-overlay')) {
                        onLight = true;
                    }

                    if (onLight) {
                        cur.classList.add('dark-mode');
                    } else {
                        cur.classList.remove('dark-mode');
                    }
                }
            }
        };

        window.addEventListener('mousemove', onMouseMove);

        const handleEnter = () => cur?.classList.add('expand');
        const handleLeave = () => cur?.classList.remove('expand');

        const interactables = document.querySelectorAll('a, button, .proj-item, .sd-row, .ht-btn, .chat-bar, .cw-close, .cw-send, .pi-expand-btn, #lightbox-close');
        interactables.forEach(el => {
            el.addEventListener('mouseenter', handleEnter);
            el.addEventListener('mouseleave', handleLeave);
        });

        // 3. GSAP Animations scoped to this component context
        const ctx = gsap.context(() => {

            // Intro Sequence (Monolith Lift)
            const tlIntro = gsap.timeline({
                onComplete: () => {
                    if (introRef.current) introRef.current.style.display = 'none';
                    document.body.classList.remove('noscroll-architectural');
                }
            });

            tlIntro.to(".intro-line", {
                y: "0%", duration: 1.2, stagger: 0.15, ease: "expo.out", delay: 0.2
            })
                .to(".intro-text-block", {
                    opacity: 0, y: -30, duration: 0.8, ease: "power2.inOut"
                }, "+=0.4")
                .to(introRef.current, {
                    yPercent: -100, duration: 1.2, ease: "expo.inOut"
                }, "-=0.2")
                .from(".gsap-hero-text", {
                    y: 50, opacity: 0, duration: 1, stagger: 0.1, ease: "power3.out"
                }, "-=0.8");

            // Hero Parallax streams animation
            const tracks = document.querySelectorAll('.h-track');
            const streamDurations = [28, 35, 24];
            const startProgress = [0.1, 0.65, 0.3];

            tracks.forEach((track, i) => {
                const tl = gsap.fromTo(track,
                    { yPercent: -50 },
                    { yPercent: 0, duration: streamDurations[i], ease: "none", repeat: -1 }
                );
                tl.progress(startProgress[i]);
            });

            // Project Cards (Metabolist abstract reveals)
            gsap.utils.toArray('.proj-item').forEach((item: any) => {
                const colorBlock = item.querySelector('.pi-color');

                gsap.from(item, {
                    y: 100, opacity: 0, duration: 1, ease: "power3.out",
                    scrollTrigger: {
                        trigger: item,
                        start: "top 85%",
                        onEnter: () => item.classList.add("revealed")
                    }
                });

                gsap.to(colorBlock, {
                    scale: 0.95,
                    ease: "none",
                    scrollTrigger: {
                        trigger: item,
                        start: "top bottom",
                        end: "bottom top",
                        scrub: true
                    }
                });
            });

            // Skills Rotated Text Parallax
            gsap.to(".s2-rotate", {
                y: () => window.innerHeight * 0.5,
                rotation: -90,
                transformOrigin: "left top",
                ease: "none",
                scrollTrigger: {
                    trigger: ".s2",
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true
                }
            });

            // Skills Catalogue Stagger — flip in then trigger stripe sweep
            gsap.from(".sc-item", {
                rotationX: 90, opacity: 0, duration: 0.8, stagger: 0.1, ease: "power2.out",
                scrollTrigger: {
                    trigger: ".skill-catalogue",
                    start: "top 80%",
                    onEnter: () => {
                        document.querySelectorAll('.sc-item').forEach((item, i) => {
                            setTimeout(() => item.classList.add('stripes-in'), i * 100 + 400);
                        });
                    }
                }
            });

            // About Blue Block Parallax (Edge clipping effect)
            gsap.fromTo(".s3-block",
                { yPercent: -20, scale: 0.9, rotation: -2 },
                {
                    yPercent: 40, scale: 1, rotation: 2, ease: "none",
                    scrollTrigger: {
                        trigger: ".s3",
                        start: "top bottom",
                        end: "bottom bottom",
                        scrub: true
                    }
                }
            );

            // Small Education Cards Scroll Stagger
            gsap.from(".edu-sm-card", {
                x: 40,
                opacity: 0,
                duration: 0.8,
                stagger: 0.15,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: ".s3-edu-grid",
                    start: "top 85%",
                }
            });

            // SGPA Counter Animation
            ScrollTrigger.create({
                trigger: ".s3-edu-grid",
                start: "top 85%",
                once: true,
                onEnter: () => {
                    if (!containerRef.current) return;
                    const counters = containerRef.current.querySelectorAll(".sgpa-counter");
                    counters.forEach((counter: any, i) => {
                        const raw = counter.getAttribute("data-target") || "0";
                        // Extract number only (handles "CGPA: 8.08" -> 8.08)
                        const target = parseFloat(raw.replace(/[^\d.]/g, "")) || 0;

                        let obj = { val: 0 };
                        gsap.to(obj, {
                            val: target,
                            duration: 2,
                            delay: i * 0.15,
                            ease: "power3.out",
                            onUpdate: () => {
                                counter.textContent = obj.val.toFixed(2);
                            }
                        });
                    });
                }
            });

            // Footer Wordmark (Rightward Reveal)
            gsap.fromTo(".s4-wordmark",
                { x: "-45%" },
                {
                    x: "5%",
                    ease: "none",
                    scrollTrigger: {
                        trigger: ".s4",
                        start: "top bottom",
                        end: "bottom bottom",
                        scrub: true
                    }
                }
            );

            // Footer Alternative Views Navigation Stagger
            gsap.from(".footer-theme-nav .ftn-label, .footer-theme-nav .ftn-link", {
                x: 40,
                opacity: 0,
                duration: 0.8,
                stagger: 0.15,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: ".s4",
                    start: "top 85%"
                }
            });

        }, containerRef);

        // Cleanup
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            interactables.forEach(el => {
                el.removeEventListener('mouseenter', handleEnter);
                el.removeEventListener('mouseleave', handleLeave);
            });
            document.documentElement.classList.remove('theme-architectural-active');
            document.body.classList.remove('theme-architectural-active');
            document.body.classList.remove('noscroll-architectural');

            // Purge GSAP Context and proper ticker removal
            ctx.revert();
            gsap.ticker.remove(tickerFn);
            lenis.destroy();
        };
    }, []);

    return (
        <div className="architectural-root" ref={containerRef}>
            {/* CURSOR */}
            <div id="cur" ref={cursorRef}></div>

            {/* INTRO OVERLAY */}
            <div id="architectural-intro" ref={introRef}>
                <div className="intro-text-block">
                    {nameParts.map((part, i) => (
                        <div key={i} className="intro-line-wrap">
                            <span className={`intro-line ${i === 1 ? 'l2' : ''}`}>{part.toUpperCase()}</span>
                        </div>
                    ))}
                    <div className="intro-line-wrap">
                        <span className="intro-line l3">{resume.personal.title} · {resume.personal.location} · {new Date().getFullYear()}</span>
                    </div>
                </div>
            </div>

            {/* NAV */}
            <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <a href="#" data-text={initials}><span>{initials}</span></a>
                <ul className="nav-links" style={{ alignItems: 'center' }}>
                    <li style={{ pointerEvents: 'auto' }}><ThemeSwitcher /></li>
                    <li><a href="#s1" onClick={(e) => handleNavClick(e, '#s1')} data-text="Work"><span>Work</span></a></li>
                    <li><a href="#s2" onClick={(e) => handleNavClick(e, '#s2')} data-text="Skills"><span>Skills</span></a></li>
                    <li><a href="#s3" onClick={(e) => handleNavClick(e, '#s3')} data-text="About"><span>About</span></a></li>
                </ul>
            </nav>

            {/* HERO */}
            <section className={`s0 ${isHeroDark ? 'dark-mode' : ''}`}>
                <div className="hero-theme-switcher">
                    <button className="ht-btn-bulb" onClick={() => setIsHeroDark(!isHeroDark)}>
                        {isHeroDark ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5" /><path d="M9 18h6" /><path d="M10 22h4" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5" /><path d="M9 18h6" /><path d="M10 22h4" /></svg>
                        )}
                    </button>
                </div>

                <div className="hero-streams">
                    {/* Stream 1 */}
                    <div className="h-stream h-stream-1">
                        <div className="h-track">
                            <div className="h-set">
                                <div className="h-card cc-0" onClick={(e) => handleCardClick(e, "What are Rohit's core engineering strengths?")}>
                                    <div className="hc-head">Prompt / 01</div>
                                    <div className="hc-q">"What are Rohit's core engineering strengths?"</div>
                                    <div className="hc-foot">Execute Query ↗</div>
                                </div>
                                <div className="h-card cc-1">
                                    <div className="hc-head">Info / 01</div>
                                    <div className="hc-q">Currently pursuing MCA at IMED Bharti Vidyapeeth (2026).</div>
                                    <div className="hc-foot">Context ↗</div>
                                </div>
                                <div className="h-card cc-2" onClick={(e) => handleCardClick(e, "How does he approach AI systems design?")}>
                                    <div className="hc-head">Prompt / 02</div>
                                    <div className="hc-q">"How does he approach AI systems design?"</div>
                                    <div className="hc-foot">Execute Query ↗</div>
                                </div>
                            </div>
                            {/* Duplicate for loop */}
                            <div className="h-set">
                                <div className="h-card cc-0" onClick={(e) => handleCardClick(e, "What are Rohit's core engineering strengths?")}>
                                    <div className="hc-head">Prompt / 01</div>
                                    <div className="hc-q">"What are Rohit's core engineering strengths?"</div>
                                    <div className="hc-foot">Execute Query ↗</div>
                                </div>
                                <div className="h-card cc-1">
                                    <div className="hc-head">Info / 01</div>
                                    <div className="hc-q">Currently pursuing MCA at IMED Bharti Vidyapeeth (2026).</div>
                                    <div className="hc-foot">Context ↗</div>
                                </div>
                                <div className="h-card cc-2" onClick={(e) => handleCardClick(e, "How does he approach AI systems design?")}>
                                    <div className="hc-head">Prompt / 02</div>
                                    <div className="hc-q">"How does he approach AI systems design?"</div>
                                    <div className="hc-foot">Execute Query ↗</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stream 2 */}
                    <div className="h-stream h-stream-2">
                        <div className="h-track">
                            <div className="h-set">
                                <div className="h-card cc-3" onClick={(e) => handleCardClick(e, "Break down the Data Analytics Pipeline architecture.")}>
                                    <div className="hc-head">Prompt / 03</div>
                                    <div className="hc-q">"Break down the Data Analytics Pipeline architecture."</div>
                                    <div className="hc-foot">Execute Query ↗</div>
                                </div>
                                <div className="h-card cc-0">
                                    <div className="hc-head">Info / 02</div>
                                    <div className="hc-q">Detail-oriented and analytically sharp. Focused on ML & engineering.</div>
                                    <div className="hc-foot">Context ↗</div>
                                </div>
                                <div className="h-card cc-4" onClick={(e) => handleCardClick(e, "Explain the AI Content Aggregation system.")}>
                                    <div className="hc-head">Prompt / 04</div>
                                    <div className="hc-q">"Explain the AI Content Aggregation system."</div>
                                    <div className="hc-foot">Execute Query ↗</div>
                                </div>
                                <div className="h-card cc-1">
                                    <div className="hc-head">Info / 03</div>
                                    <div className="hc-q">Scalable AI agent orchestration with LangGraph & FastAPI.</div>
                                    <div className="hc-foot">Context ↗</div>
                                </div>
                            </div>
                            {/* Duplicate for loop */}
                            <div className="h-set">
                                <div className="h-card cc-3" onClick={(e) => handleCardClick(e, "Break down the Data Analytics Pipeline architecture.")}>
                                    <div className="hc-head">Prompt / 03</div>
                                    <div className="hc-q">"Break down the Data Analytics Pipeline architecture."</div>
                                    <div className="hc-foot">Execute Query ↗</div>
                                </div>
                                <div className="h-card cc-0">
                                    <div className="hc-head">Info / 02</div>
                                    <div className="hc-q">Detail-oriented and analytically sharp. Focused on ML & engineering.</div>
                                    <div className="hc-foot">Context ↗</div>
                                </div>
                                <div className="h-card cc-4" onClick={(e) => handleCardClick(e, "Explain the AI Content Aggregation system.")}>
                                    <div className="hc-head">Prompt / 04</div>
                                    <div className="hc-q">"Explain the AI Content Aggregation system."</div>
                                    <div className="hc-foot">Execute Query ↗</div>
                                </div>
                                <div className="h-card cc-1">
                                    <div className="hc-head">Info / 03</div>
                                    <div className="hc-q">Scalable AI agent orchestration with LangGraph & FastAPI.</div>
                                    <div className="hc-foot">Context ↗</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stream 3 */}
                    <div className="h-stream h-stream-3">
                        <div className="h-track">
                            <div className="h-set">
                                <div className="h-card cc-2" onClick={(e) => handleCardClick(e, "Summarize his professional experience.")}>
                                    <div className="hc-head">Prompt / 05</div>
                                    <div className="hc-q">"Summarize his professional experience."</div>
                                    <div className="hc-foot">Execute Query ↗</div>
                                </div>
                                <div className="h-card cc-3">
                                    <div className="hc-head">Info / 04</div>
                                    <div className="hc-q">Expertise in LangGraph, FastAPI, and Supabase pgvector.</div>
                                    <div className="hc-foot">Context ↗</div>
                                </div>
                                <div className="h-card cc-0" onClick={(e) => handleCardClick(e, "What is his frontend stack?")}>
                                    <div className="hc-head">Prompt / 06</div>
                                    <div className="hc-q">"What is his frontend stack?"</div>
                                    <div className="hc-foot">Execute Query ↗</div>
                                </div>
                            </div>
                            {/* Duplicate for loop */}
                            <div className="h-set">
                                <div className="h-card cc-2" onClick={(e) => handleCardClick(e, "Summarize his professional experience.")}>
                                    <div className="hc-head">Prompt / 05</div>
                                    <div className="hc-q">"Summarize his professional experience."</div>
                                    <div className="hc-foot">Execute Query ↗</div>
                                </div>
                                <div className="h-card cc-3">
                                    <div className="hc-head">Info / 04</div>
                                    <div className="hc-q">Expertise in LangGraph, FastAPI, and Supabase pgvector.</div>
                                    <div className="hc-foot">Context ↗</div>
                                </div>
                                <div className="h-card cc-0" onClick={(e) => handleCardClick(e, "What is his frontend stack?")}>
                                    <div className="hc-head">Prompt / 06</div>
                                    <div className="hc-q">"What is his frontend stack?"</div>
                                    <div className="hc-foot">Execute Query ↗</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="hero-fade"></div>

                <div className="s0-letter">{giantLetter}</div>
                <div className="s0-content">
                    <h1 className="s0-name">
                        {nameParts.map((part, i) => (
                            <div key={i} className="gsap-hero-text">{part.toUpperCase()}</div>
                        ))}
                        <span className="gsap-hero-text">AI Applications · Automation · Full-Stack</span>
                    </h1>
                    <div className="s0-right">
                        <p className="s0-bio gsap-hero-text">
                            Building intelligent systems at the intersection of machine learning and precise engineering.
                            Detail-oriented. Analytically inclined.
                        </p>
                    </div>
                </div>
            </section>

            {/* PROJECTS */}
            <section className="s1" id="s1">
                <div className="s1-label">Selected Work</div>
                <div className="proj-list">
                    {resume.projects.map((proj: any, i: number) => (
                        <ArchitecturalProjectCard key={proj.title} proj={proj} index={i} onKeywordClick={handleKeywordClick} />
                    ))}
                </div>
            </section>

            {/* SKILLS */}
            <section className="s2" id="s2">
                <div className="s2-rotate">SKILLS — SYSTEM — LOGIC</div>
                <div className="s2-inner">
                    <div className="s2-head">
                        <div>
                            <h2 className="s2-title">Material<br />Strengths</h2>
                            <div className="s2-toggle">
                                <button
                                    className={`s2-tab ${activeTab === 'technical' ? 'active' : ''}`}
                                    onClick={() => handleTabChange('technical')}
                                >
                                    Technical
                                </button>
                                <button
                                    className={`s2-tab ${activeTab === 'soft' ? 'active' : ''}`}
                                    onClick={() => handleTabChange('soft')}
                                >
                                    Soft Skills
                                </button>
                            </div>
                        </div>
                        <p className="s2-sub">Tools, languages, and systems built through deliberate practice and continuous iteration.</p>
                    </div>

                    <div className="skill-catalogue" ref={catalogueRef}>
                        {currentSkills.map((skill, i) => {
                            const color = palette[i % palette.length];
                            return (
                                <div key={i} className="sc-item">
                                    <div className="sc-chip" style={{ '--chip-color': color } as React.CSSProperties}>
                                        <div className="sc-stripe"></div>
                                        <div className="sc-stripe"></div>
                                        <div className="sc-stripe"></div>
                                    </div>
                                    <div
                                        className="sc-name"
                                        data-name={skill}
                                        style={{ '--chip-color': color, fontSize: '1.6rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingBottom: '0.2em' } as React.CSSProperties}
                                    >
                                        {skill}
                                    </div>
                                    <div className="sc-detail">{renderedTab === 'technical' ? 'Core Competency' : 'Interpersonal'}</div>
                                    <div className="sc-level" style={{ '--chip-color': color } as React.CSSProperties}>{getAbbr(skill)}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ABOUT */}
            <section className="s3" id="s3">
                <div className="s3-block">
                    <img src="/RohitProfilePhoto.jpeg" alt="Rohit Akulwar" className="s3-profile-img" />
                </div>
                <div className="s3-bottom">
                    <div>{/* empty for grid */}</div>
                    <div className="s3-right">
                        <h2 className="s3-title">
                            About
                            <em>background & contact</em>
                        </h2>
                        <p className="s3-text">
                            {resume.personal.objective}
                        </p>

                        {/* Interactive Small Education Cards directly beneath text */}
                        <div className="s3-edu-grid">
                            {resume.education.slice(0, 2).map((edu, i) => (
                                <div key={i} className="edu-sm-card">
                                    <span className="edu-sm-year">{edu.dates}</span>
                                    <div className="edu-sm-deg">{edu.degree}</div>
                                    <div className="edu-sm-inst">{edu.institution}</div>
                                    <div className="edu-sm-sgpa">SGPA <span className="sgpa-counter" data-target={edu.score}>{edu.score}</span></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="s4">
                <div className="s4-top s4-centered" style={{ position: 'relative' }}>
                    <div className="s4-contact">
                        {resume.personal.linkedin && (
                            <a href={resume.personal.linkedin} className="s4-clink" data-text="LINKEDIN"><span>LINKEDIN</span></a>
                        )}
                        {resume.personal.github && (
                            <a href={resume.personal.github} className="s4-clink" data-text="GITHUB"><span>GITHUB</span></a>
                        )}
                        {resume.personal.email && (
                            <a href={`mailto:${resume.personal.email}`} className="s4-clink" data-text="EMAIL"><span>EMAIL</span></a>
                        )}
                    </div>
                </div>
                <div className="s4-wordmark-wrap" style={{ position: 'relative' }}>
                    <div className="s4-wordmark">{nameParts[0]?.toUpperCase()}</div>

                    {/* Alternative Themes Navigation */}
                    <div className="footer-theme-nav">
                        <div className="ftn-label">Alternative Views</div>
                        <div className="ftn-links">
                            <button className="ftn-link" data-text="MODERN" onClick={() => switchTheme('modern')}>
                                <span>MODERN</span>
                            </button>
                            <button className="ftn-link" data-text="RENAISSANCE" onClick={() => switchTheme('renaissance')}>
                                <span>RENAISSANCE</span>
                            </button>
                        </div>
                    </div>
                </div>
            </footer>

            {/* CHAT INTERFACE */}
            {/* Transparent hover hit area for the bottom of the screen */}
            <div
                style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', height: '100px', zIndex: 997, pointerEvents: 'auto' }}
                onMouseEnter={() => setIsChatBarHovered(true)}
                onMouseLeave={() => setIsChatBarHovered(false)}
            />

            <div
                id="architectural-chat-bar"
                ref={chatBarRef}
                className={`chat-bar ${isChatBarVisible || isChatBarHovered ? 'visible' : ''}`}
                onClick={() => setIsChatOpen(true)}
                onMouseEnter={() => setIsChatBarHovered(true)}
                onMouseLeave={() => setIsChatBarHovered(false)}
            >
                <span>Initialize Intelligence Agent ↗</span>
            </div>

            <div id="architectural-chat-window" ref={chatWindowRef} className="chat-window">
                <div className="cw-header">
                    <h3 className="cw-title">Intelligence Terminal</h3>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="cw-expand" onClick={() => setIsChatExpanded(!isChatExpanded)}>
                            {isChatExpanded ? 'Collapse ↙' : 'Expand ↗'}
                        </button>
                        <button className="cw-close" onClick={() => setIsChatOpen(false)}>Close ✕</button>
                    </div>
                </div>
                <div className="cw-body">
                    {messages.length === 0 && !isLoading && (
                        <div className="cw-msg cw-bot">
                            <div className="cw-sender">System / 01</div>
                            <p>Context loaded. I am ready to answer queries regarding Rohit's technical background, architecture decisions, and project specifications.</p>
                        </div>
                    )}
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`cw-msg ${msg.role === 'user' ? 'cw-user' : 'cw-bot'}`}>
                            <div className="cw-sender">
                                {msg.role === 'user' ? 'User' : 'System'} / {(idx + 2).toString().padStart(2, '0')}
                            </div>
                            <p>
                                {msg.role === 'user'
                                    ? msg.content
                                    : msg.content.replace(/\*/g, '')
                                }
                            </p>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="cw-msg cw-bot cw-processing">
                            <div className="cw-sender">System / Processing...</div>
                            <p style={{ padding: '1.5rem', background: 'var(--sage-bg)', border: '1px solid var(--sage-dk)', margin: 0 }}>
                                <span className="cw-loading">
                                    <span className="cw-block"></span>
                                    <span className="cw-block"></span>
                                    <span className="cw-block"></span>
                                </span>
                            </p>
                        </div>
                    )}
                    <div ref={chatBottomRef} />
                </div>
                <div className="cw-input-area">
                    <input
                        type="text"
                        className="cw-input"
                        placeholder="Initiate query..."
                        value={chatText}
                        onChange={(e) => setChatText(e.target.value)}
                        onKeyDown={handleChatKey}
                    />
                    <button
                        className="cw-send"
                        onClick={() => {
                            if (chatText.trim() && !isLoading) {
                                sendMessage(chatText.trim());
                                setChatText('');
                            }
                        }}
                    >
                        Transmit ↗
                    </button>
                </div>
            </div>

            {/* LIGHTBOX OVERLAY */}
            <div id="video-lightbox-overlay">
                <button id="lightbox-close">Close ✕</button>
            </div>

        </div>
    );
}