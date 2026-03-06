import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import type { ResumeData } from '../../types';
import { useChat } from '../../hooks/useChat';
import ThemeSwitcher from '../renaissance/ThemeSwitcher';
import './ArchitecturalTheme.css';

gsap.registerPlugin(ScrollTrigger);

interface Props {
    resume: ResumeData;
}

export default function ArchitecturalTheme({ resume }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const cursorRef = useRef<HTMLDivElement>(null);
    const introRef = useRef<HTMLDivElement>(null);
    const catalogueRef = useRef<HTMLDivElement>(null);
    // true while cards are edge-on waiting for React to commit new content
    const isFlippingRef = useRef<boolean>(false);

    const [activeTab, setActiveTab] = useState<'technical' | 'soft'>('technical');
    const [renderedTab, setRenderedTab] = useState<'technical' | 'soft'>('technical');
    const [isHeroDark, setIsHeroDark] = useState<boolean>(true);

    const [isChatBarVisible, setIsChatBarVisible] = useState<boolean>(false);
    const [isChatBarHovered, setIsChatBarHovered] = useState<boolean>(false);
    const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
    const [chatText, setChatText] = useState('');

    const scrollTimeout = useRef<number | null>(null);
    const chatBottomRef = useRef<HTMLDivElement>(null);

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
                    duration: 0.35,
                    ease: 'power2.out',
                    delay: index * 0.06,
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

    // Hero Falling Cards Interaction (Growing Streak to Chat)
    function handleCardClick(e: React.MouseEvent<HTMLDivElement>, qText: string) {
        const card = e.currentTarget;
        if (card.classList.contains('animating') || isLoading) return;
        card.classList.add('animating');

        const rect = card.getBoundingClientRect();
        const clone = card.cloneNode(true) as HTMLDivElement;

        const computedStyle = window.getComputedStyle(card);
        const cardBgColor = computedStyle.backgroundColor;

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

        const perimeter = (rect.width + rect.height) * 2;
        const svgHTML = `
            <svg width="${rect.width + 20}" height="${rect.height + 20}" style="position:absolute; top:-10px; left:-10px; z-index:10; pointer-events:none; overflow:visible;">
                <rect x="10" y="10" width="${rect.width}" height="${rect.height}" fill="none" 
                      stroke="${cardBgColor}" stroke-width="6" stroke-linecap="round"
                      stroke-dasharray="0 ${perimeter + 100}" 
                      stroke-dashoffset="0" 
                      style="filter: drop-shadow(0 0 8px ${cardBgColor}) drop-shadow(0 0 16px ${cardBgColor});"
                      class="glowing-streak-rect" />
            </svg>
        `;
        clone.insertAdjacentHTML('beforeend', svgHTML);

        gsap.to(card, { opacity: 0, duration: 0.2 });

        const glowObj = { len: 0 };
        const tl = gsap.timeline({
            onComplete: () => {
                clone.remove();
                gsap.to(card, { opacity: 1, duration: 1, delay: 1 });
                card.classList.remove('animating');

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
            scale: 1.35,
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
                    duration: 0.2,
                    ease: 'power1.in',
                    delay: index * 0.08,
                });
            });

            // Wait until the last card is edge-on, then update React state.
            // The useEffect watching renderedTab will fire after React commits
            // the new content into the still-invisible nodes, then flip back.
            const edgeOnMs = ((items.length - 1) * 0.08 + 0.22) * 1000;
            setTimeout(() => {
                isFlippingRef.current = true;
                setRenderedTab(tab);
            }, edgeOnMs);

        } else {
            setRenderedTab(tab);
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

        // Chat UI Visibility Logic (Lenis level)
        lenis.on('scroll', () => {
            ScrollTrigger.update();
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
                    if (el.closest('#architectural-chat-window')) {
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

        const interactables = document.querySelectorAll('a, button, .proj-item, .sd-row, .ht-btn, .chat-bar, .cw-close, .cw-send');
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

            // About Blue Block Parallax
            gsap.fromTo(".s3-block",
                { yPercent: -20, scale: 0.9, rotation: -2 },
                {
                    yPercent: 30, scale: 1, rotation: 2, ease: "none",
                    scrollTrigger: {
                        trigger: ".s3",
                        start: "top bottom",
                        end: "bottom top",
                        scrub: true
                    }
                }
            );

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
                    <li><a href="#s1" data-text="Work"><span>Work</span></a></li>
                    <li><a href="#s2" data-text="Skills"><span>Skills</span></a></li>
                    <li><a href="#s3" data-text="About"><span>About</span></a></li>
                </ul>
            </nav>

            {/* HERO */}
            <section className={`s0 ${isHeroDark ? 'dark-mode' : ''}`}>
                <div className="hero-theme-switcher">
                    <span>Hero Theme:</span>
                    <button className={`ht-btn ${isHeroDark ? 'active' : ''}`} onClick={() => setIsHeroDark(true)}>Dark</button>
                    <button className={`ht-btn ${!isHeroDark ? 'active' : ''}`} onClick={() => setIsHeroDark(false)}>Light</button>
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
                                <div className="h-card cc-3" onClick={(e) => handleCardClick(e, "Break down the Titanic Agent architecture.")}>
                                    <div className="hc-head">Prompt / 03</div>
                                    <div className="hc-q">"Break down the Titanic Agent architecture."</div>
                                    <div className="hc-foot">Execute Query ↗</div>
                                </div>
                                <div className="h-card cc-0">
                                    <div className="hc-head">Info / 02</div>
                                    <div className="hc-q">Detail-oriented and analytically sharp. Focused on ML & engineering.</div>
                                    <div className="hc-foot">Context ↗</div>
                                </div>
                                <div className="h-card cc-4" onClick={(e) => handleCardClick(e, "Explain the n8n automation pipeline.")}>
                                    <div className="hc-head">Prompt / 04</div>
                                    <div className="hc-q">"Explain the n8n automation pipeline."</div>
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
                                <div className="h-card cc-3" onClick={(e) => handleCardClick(e, "Break down the Titanic Agent architecture.")}>
                                    <div className="hc-head">Prompt / 03</div>
                                    <div className="hc-q">"Break down the Titanic Agent architecture."</div>
                                    <div className="hc-foot">Execute Query ↗</div>
                                </div>
                                <div className="h-card cc-0">
                                    <div className="hc-head">Info / 02</div>
                                    <div className="hc-q">Detail-oriented and analytically sharp. Focused on ML & engineering.</div>
                                    <div className="hc-foot">Context ↗</div>
                                </div>
                                <div className="h-card cc-4" onClick={(e) => handleCardClick(e, "Explain the n8n automation pipeline.")}>
                                    <div className="hc-head">Prompt / 04</div>
                                    <div className="hc-q">"Explain the n8n automation pipeline."</div>
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
                    {resume.projects.map((proj, i) => (
                        <div key={proj.title} className="proj-item">
                            <div className={`pi-color pi-c${i % 4}`}>
                                <div className="pi-num">{(i + 1).toString().padStart(2, '0')}</div>
                                <div className="pi-title-big">
                                    {proj.title.split(' ').map((word: string, wi: number) => (
                                        <div key={wi}>{word}</div>
                                    ))}
                                </div>
                            </div>
                            <div className="pi-body">
                                <div className="pi-cat">Selected Project</div>
                                <p className="pi-desc">{proj.description}</p>
                                <div className="pi-pills">
                                    {proj.technologies.slice(0, 4).map(tech => (
                                        <span key={tech} className="pi-pill">{tech}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
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
                <div className="s3-block"></div>
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
                        <div className="s3-data">
                            <div className="sd-row"><span className="sd-k">Location</span><span className="sd-v">{resume.personal.location}</span></div>
                            <div className="sd-row">
                                <span className="sd-k">Education</span>
                                <span className="sd-v">
                                    {resume.education.length > 0 ? `${resume.education[0].degree} — ${resume.education[0].institution}` : 'Not Available'}
                                </span>
                            </div>
                            <div className="sd-row">
                                <span className="sd-k">Links</span>
                                <span className="sd-v">
                                    {resume.personal.github && <><a href={resume.personal.github} target="_blank" rel="noreferrer">GitHub</a> / </>}
                                    {resume.personal.linkedin && <a href={resume.personal.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="s4">
                <div className="s4-top">
                    <div className="s4-status">
                        Status <span>Available</span><br />
                        Location <span>{resume.personal.location}</span><br />
                        Year <span>{new Date().getFullYear()}</span>
                    </div>
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
                <div className="s4-wordmark-wrap">
                    <div className="s4-wordmark">{nameParts[nameParts.length - 1]?.toUpperCase()}</div>
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
                className={`chat-bar ${isChatBarVisible || isChatBarHovered ? 'visible' : ''}`}
                onClick={() => setIsChatOpen(true)}
                onMouseEnter={() => setIsChatBarHovered(true)}
                onMouseLeave={() => setIsChatBarHovered(false)}
            >
                <span>Initialize Intelligence Agent ↗</span>
            </div>

            <div id="architectural-chat-window" className={`chat-window ${isChatOpen ? 'open' : ''}`}>
                <div className="cw-header">
                    <h3 className="cw-title">Intelligence Terminal</h3>
                    <button className="cw-close" onClick={() => setIsChatOpen(false)}>Close ✕</button>
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
        </div>
    );
}