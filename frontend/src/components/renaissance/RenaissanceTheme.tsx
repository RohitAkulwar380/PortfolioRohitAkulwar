/**
 * RenaissanceTheme.tsx
 * ─────────────────────
 * Based on renaissance-theme.html — keeps the original 3-section layout:
 *   Masthead → headline-section (portrait | main | sidebar) → skills → projects → footer
 * Spread full-width with 3-col prose text and 5-col skills grid.
 */

import { useEffect } from 'react';
import type { ResumeData } from '../../types';
import ThemeSwitcher from './ThemeSwitcher';
import RenaissanceChatDrawer from './RenaissanceChatDrawer';
import './RenaissanceTheme.css';

interface Props { resume: ResumeData | null; }

const SKILL_GROUPS = [
    {
        title: 'Core Languages',
        skills: [
            { name: 'Python', type: 'Primary', level: 5 },
            { name: 'Java', type: 'Secondary', level: 4 },
            { name: 'Kotlin', type: 'JVM', level: 4 },
            { name: 'JavaScript', type: 'Web', level: 4 },
            { name: 'TypeScript', type: 'Strict', level: 4 }
        ]
    },
    {
        title: 'AI & Intelligence',
        skills: [
            { name: 'LangGraph', type: 'Agents', level: 5 },
            { name: 'RAG Systems', type: 'Retrieval', level: 5 },
            { name: 'Vector DBs', type: 'Storage', level: 4 },
            { name: 'OpenAI API', type: 'Models', level: 4 },
            { name: 'Whisper', type: 'Audio', level: 3 }
        ]
    },
    {
        title: 'Frameworks & Tools',
        skills: [
            { name: 'FastAPI', type: 'Backend', level: 5 },
            { name: 'n8n', type: 'Automation', level: 5 },
            { name: 'React', type: 'Frontend', level: 4 },
            { name: 'Supabase', type: 'Database', level: 3 },
            { name: 'GSAP', type: 'Animation', level: 4 }
        ]
    }
];

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];

const termsToHighlight = [
    'artificial intelligence and automation systems',
    'AI applications and automation systems',
    'workflow automation using n8n',
    'full-stack arts of development',
    'LangGraph agents',
    'scalable AI solutions'
];

function HighlightText({ text, highlights }: { text: string; highlights: string[] }) {
    if (!text) return null;
    if (!highlights.length) return <>{text}</>;

    const escapedHighlights = highlights.map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escapedHighlights.join('|')})`, 'gi');
    const parts = text.split(regex);

    return (
        <>
            {parts.map((part, i) => {
                const isHighlight = highlights.some(h => h.toLowerCase() === part.toLowerCase());
                if (isHighlight) {
                    return <span key={i} className="r-highlight">{part}</span>;
                }
                return <span key={i}>{part}</span>;
            })}
        </>
    );
}

export default function RenaissanceTheme({ resume }: Props) {

    /* Unlock body scroll while mounted; restore on unmount */
    useEffect(() => {
        document.body.style.overflow = 'auto';

        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.5
        };

        const highlightObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        const timeoutId = setTimeout(() => {
            document.querySelectorAll('.r-highlight, .r-circle-highlight').forEach(el => {
                highlightObserver.observe(el);
            });
        }, 100);

        return () => {
            document.body.style.overflow = '';
            highlightObserver.disconnect();
            clearTimeout(timeoutId);
        };
    }, []);

    const p = resume?.personal;
    const edu = resume?.education?.[0];
    const projects = resume?.projects ?? [];

    return (
        <div className="renaissance-root">

            {/* ── Atmosphere ─────────────────────────────────────── */}
            <div className="r-stars-decoration">
                {[['8%', '3%', '0s'], ['15%', '92%', '1.2s'], ['45%', '1%', '2.4s'],
                ['70%', '97%', '0.8s'], ['88%', '5%', '3s'], ['30%', '95%', '1.8s']].map(([t, l, d], i) => (
                    <span key={i} className="r-star" style={{ top: t, left: l, animationDelay: d }}>✦</span>
                ))}
            </div>
            <div className="r-burn-overlay" />
            <div className="r-fold-line-h" style={{ top: '33%' }} />
            <div className="r-fold-line-h" style={{ top: '66%' }} />

            <div className="r-page-wrapper">

                {/* ═══════════ MASTHEAD ═══════════ */}
                <header className="r-masthead">
                    <div className="r-masthead-top-rule" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'nowrap' }}>
                        <span>Est. Anno Domini 2001</span>
                        <ThemeSwitcher />
                        <span>Pune, India Dispatch</span>
                    </div>
                    <h1 className="r-masthead-title">The Akulwar Dispatch</h1>
                    <div className="r-masthead-subtitle">
                        Portfolio of Record &nbsp;·&nbsp; Software Engineering &nbsp;·&nbsp; Artificial Intelligence &nbsp;·&nbsp; Automation Systems
                    </div>
                    <div className="r-masthead-date-bar">
                        <span>Vol. XXIII &nbsp;·&nbsp; No. 1</span>
                        <span className="r-masthead-stars">✦ ✦ ✦</span>
                        <span>March, Anno Domini MMXXVI</span>
                        <span className="r-masthead-stars">✦ ✦ ✦</span>
                        <span>Price: One Good Opportunity</span>
                    </div>
                </header>

                {/* ═══════════ NAV ═══════════ */}
                <nav className="r-nav-bar">
                    <a href="#r-about">About</a>
                    <a href="#r-skills">Skills</a>
                    <a href="#r-projects">Campaigns</a>
                    <a href="#r-education">Education</a>
                    <a href="#r-contact">Contact</a>
                </nav>

                {/* ═══════════ HEADLINE SECTION ═══════════ */}
                {/* portrait (1fr) | divider | main (3fr) | divider | sidebar (1fr) */}
                <section className="r-headline-section" id="r-about">

                    {/* ── COL 1: Portrait + Dossier ── */}
                    <div className="r-col-portrait">
                        <div className="r-portrait-frame">
                            <img
                                src="/RohitProfilePhoto.jpeg"
                                alt={p?.name ?? 'Rohit Bharat Akulwar'}
                            />
                        </div>
                        <p className="r-portrait-caption">
                            Fig. I — R.B. Akulwar, Software Developer<br />
                            Photographed at Headquarters, Pune
                        </p>

                        <div className="r-vitals-box">
                            <h4>Dossier</h4>
                            <div className="r-vital-row"><span className="r-vital-label">Station:</span><span className="r-vital-value">{p?.location ?? 'Pune, India'}</span></div>
                            <div className="r-vital-row"><span className="r-vital-label">Rank:</span><span className="r-vital-value">{edu?.degree ?? 'MCA Candidate'}</span></div>
                            <div className="r-vital-row"><span className="r-vital-label">Unit:</span><span className="r-vital-value">{edu?.institution ?? 'IMED Bharti Vidyapeeth'}</span></div>
                            <div className="r-vital-row"><span className="r-vital-label">Mission:</span><span className="r-vital-value">AI &amp; Automation</span></div>
                            <div className="r-vital-row"><span className="r-vital-label">Age:</span><span className="r-vital-value">23 Years</span></div>
                        </div>
                    </div>

                    <div className="r-col-divider" />

                    {/* ── COL 2: Main Headline + 3-column lead text ── */}
                    <div className="r-col-main">
                        <div className="r-headline-kicker">Special Report — Technology &amp; Innovation</div>

                        <h2 className="r-main-headline">
                            Engineer of the New Machine Age
                            <em>builds intelligent systems that adapt, endure &amp; conquer</em>
                        </h2>

                        <div className="r-headline-rule" />

                        <div className="r-byline">
                            By <strong>{p?.name ?? 'Rohit Bharat Akulwar'}</strong> &nbsp;·&nbsp;
                            Our Own Correspondent, Pune Station &nbsp;·&nbsp; March 2026
                        </div>

                        <p className="r-lead-text">
                            <HighlightText
                                text={p?.objective ?? 'Aspiring software developer with a formidable focus upon artificial intelligence and automation systems. A detail-oriented problem solver of considerable analytical power, demonstrating remarkable adaptability across the rapidly evolving theatres of technological conflict. Trained in the full-stack arts of development, our correspondent has constructed AI-powered applications of considerable distinction — from LangGraph agents to learning assistants capable of digesting entire video archives. Having recently been summoned to interview by TailorTalk and Emergence Software, the young engineer stands at the threshold of a most distinguished campaign. With arms forged in Python, Java, and the Kotlin protocols, and intelligence supplied by LangGraph and FastAPI, the subject is prepared for the campaigns of the new machine age.'}
                                highlights={termsToHighlight}
                            />
                        </p>

                        <div className="r-dispatch-tags">
                            <span className="r-dispatch-tag highlight">AI Applications</span>
                            <span className="r-dispatch-tag">Workflow Automation</span>
                            <span className="r-dispatch-tag">Full-Stack</span>
                            <span className="r-dispatch-tag">Python · Java · Kotlin</span>
                            <span className="r-dispatch-tag">n8n · FastAPI</span>
                        </div>
                    </div>

                    <div className="r-col-divider" />

                    {/* ── COL 3: Links + intelligence boxes ── */}
                    <div className="r-col-sidebar">
                        <div className="r-sidebar-box">
                            <div className="r-sidebar-box-header">Communiqués</div>
                            <div className="r-sidebar-box-body">
                                {p?.linkedin && (
                                    <a href={p.linkedin} className="r-sidebar-link" target="_blank" rel="noopener noreferrer">
                                        <span className="r-link-glyph">⊕</span><span>LinkedIn Dispatch</span>
                                    </a>
                                )}
                                {p?.github && (
                                    <a href={p.github} className="r-sidebar-link" target="_blank" rel="noopener noreferrer">
                                        <span className="r-link-glyph">⊕</span><span>GitHub Repository</span>
                                    </a>
                                )}
                                {p?.email && (
                                    <a href={`mailto:${p.email}`} className="r-sidebar-link">
                                        <span className="r-link-glyph">⊕</span><span>Electronic Missive</span>
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="r-star-ornament">✦ ✦ ✦</div>

                        <div className="r-sidebar-box">
                            <div className="r-sidebar-box-header">Intelligence Report</div>
                            <div className="r-sidebar-box-body">
                                <p style={{ fontFamily: "'IM Fell English',serif", fontSize: '0.8rem', lineHeight: 1.65, color: 'var(--ink-faded)', fontStyle: 'italic' }}>
                                    "Our operatives confirm mastery of the Python tongue, Java scriptures, and the arcane Kotlin protocols — a most formidable arsenal indeed."
                                </p>
                                <p style={{ fontFamily: "'Special Elite',monospace", fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-light)', marginTop: '0.6rem' }}>
                                    — Field Assessment, March 2026
                                </p>
                            </div>
                        </div>

                        <div className="r-sidebar-box" style={{ marginTop: '1rem' }} id="r-education">
                            <div className="r-sidebar-box-header">Theatre of Operations</div>
                            <div className="r-sidebar-box-body">
                                {[['LLM Engineering', '✦✦✦✦✦'], ['RAG Systems', '✦✦✦✦✦'], ['n8n Automation', '✦✦✦✦'], ['GSAP & Frontend', '✦✦✦✦']].map(([name, stars]) => (
                                    <div className="r-theatre-row" key={name}>
                                        <span className="r-theatre-name">{name}</span>
                                        <span className="r-theatre-stars">{stars}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {edu && (
                            <div className="r-sidebar-box" style={{ marginTop: '1rem' }}>
                                <div className="r-sidebar-box-header">Academy</div>
                                <div className="r-sidebar-box-body">
                                    <div className="r-vital-row"><span className="r-vital-label">Degree:</span><span className="r-vital-value">{edu.degree}</span></div>
                                    <div className="r-vital-row"><span className="r-vital-label">Institution:</span><span className="r-vital-value">{edu.institution}</span></div>
                                    <div className="r-vital-row"><span className="r-vital-label">Period:</span><span className="r-vital-value">{edu.dates}</span></div>
                                    {edu.score && <div className="r-vital-row"><span className="r-vital-label">Honours:</span><span className="r-vital-value">{edu.score}</span></div>}
                                </div>
                            </div>
                        )}
                    </div>

                </section>

                {/* ═══════════ SKILLS ═══════════ */}
                <section id="r-skills">
                    <div className="r-section-header">
                        <hr className="r-section-rule-left" />
                        <h2>Arsenal of Competencies</h2>
                        <hr className="r-section-rule" />
                    </div>
                    <div className="r-skills-glossary">
                        {SKILL_GROUPS.map((group) => (
                            <div className="r-skill-group" key={group.title}>
                                <h3>{group.title}</h3>
                                <ul>
                                    {group.skills.map((skill) => (
                                        <li key={skill.name}>
                                            <span className={`r-skill-name ${skill.level >= 5 ? 'r-circle-highlight' : ''}`}>
                                                {skill.name}
                                                {skill.level >= 5 && (
                                                    <svg className="r-handdrawn-circle" viewBox="0 0 100 40" preserveAspectRatio="none">
                                                        <path d="M 12 25 C 20 5, 80 0, 92 18 C 98 32, 60 42, 18 35 C 2 30, -2 15, 22 10" />
                                                    </svg>
                                                )}
                                            </span>
                                            <span className="r-skill-type">{skill.type}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ═══════════ PROJECTS ═══════════ */}
                <section id="r-projects">
                    <div className="r-section-header">
                        <hr className="r-section-rule-left" />
                        <h2>Notable Campaigns</h2>
                        <hr className="r-section-rule" />
                    </div>
                    <div className="r-projects-grid">
                        {projects.map((proj, i) => (
                            <div className="r-project-card" key={proj.title}>
                                {i === 0 && <span className="r-featured-badge">Front Page</span>}
                                <div className="r-project-issue">Dispatch No. {ROMAN[i] ?? i + 1} — AI Systems</div>
                                <h3 className="r-project-headline">{proj.title}</h3>
                                <p className="r-project-deck">{proj.description}</p>
                                <div className="r-project-tech">
                                    {proj.technologies.map(t => <span key={t}>{t}</span>)}
                                </div>
                            </div>
                        ))}
                        {/* Parchment fillers to complete the last row so grid lines don't bleed */}
                        {Array.from({ length: (3 - (projects.length % 3)) % 3 }).map((_, i) => (
                            <div key={`filler-${i}`} style={{ background: 'var(--parchment)' }} />
                        ))}
                    </div>

                    <div className="r-pull-quote">
                        <blockquote>
                            "A software developer building things that adapt — in the tradition of the great artificers, forging tools not for a single battle, but for the campaigns of a generation."
                            <cite>— Self-assessment filed at portfolio headquarters, Pune Station</cite>
                        </blockquote>
                    </div>
                </section>

                {/* ═══════════ FOOTER ═══════════ */}
                <footer className="r-footer" id="r-contact">
                    <div className="r-footer-left">
                        {p?.name ?? 'Rohit Bharat Akulwar'}<br />
                        {edu?.degree ?? 'MCA'} — {edu?.institution ?? 'IMED Bharti Vidyapeeth'}<br />
                        {p?.location ?? 'Pune, Maharashtra, India'}<br />
                        {p?.email && <>{p.email}<br /></>}
                        © Anno Domini MMXXVI
                    </div>
                    <div className="r-footer-center">✦</div>
                    <div className="r-footer-right">
                        All dispatches verified &amp; sealed<br />
                        by the Office of the Portfolio<br />
                        <em>Omnia dicta fortiora si dicta Latina</em>
                    </div>
                </footer>

                {/* ═══════════ CHAT ORACLE ═══════════ */}
                <RenaissanceChatDrawer />

            </div>
        </div>
    );
}
