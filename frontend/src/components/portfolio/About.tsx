/*
 * components/portfolio/About.tsx
 * ───────────────────────────────
 * Two-column layout: stats on left, headline + bio + tags on right.
 * Data-driven from PersonalInfo — no hardcoded content.
 */

import type { PersonalInfo } from '../../types';
import './About.css';

interface AboutProps {
    personal: PersonalInfo;
}

export default function About({ personal }: AboutProps) {
    // Derive a short bio from the objective — first two sentences only
    const shortBio = personal.objective
        .split('. ')
        .slice(0, 2)
        .join('. ')
        .trim()
        + '.';

    return (
        <section className="section about" id="about">
            <p className="section-eyebrow" id="about-heading">About</p>

            <div className="about__grid">

                {/* ── Left: Quick facts ────────────────────────────────── */}
                <div className="about__stats">

                    <div className="about__stat">
                        <span className="about__stat-label">Based in</span>
                        <span className="about__stat-value">{personal.location}</span>
                    </div>

                    <div className="about__stat">
                        <span className="about__stat-label">Degree</span>
                        <span className="about__stat-value">
                            MCA — IMED<br />Bharti Vidyapeeth
                        </span>
                    </div>

                    <div className="about__stat">
                        <span className="about__stat-label">Current Focus</span>
                        <span className="about__stat-value about__stat-value--accent">
                            AI &amp; Automation
                        </span>
                    </div>

                    <div className="about__stat">
                        <span className="about__stat-label">Languages</span>
                        <span className="about__stat-value">
                            Python · Java · JS
                        </span>
                    </div>

                    <div className="about__stat">
                        <span className="about__stat-label">Tools</span>
                        <span className="about__stat-value">
                            n8n · Supabase · OpenRouter
                        </span>
                    </div>

                </div>

                {/* ── Right: Headline + Bio + Tags ─────────────────────── */}
                <div className="about__bio">

                    <h3 className="about__headline">
                        Software developer building things<br />
                        <span className="about__carousel">
                            <span className="about__carousel-items">
                                <em>that think.</em>
                                <em>that scale.</em>
                                <em>that adapt.</em>
                                <em aria-hidden="true">that think.</em>
                            </span>
                        </span>
                    </h3>

                    <p className="about__text">{shortBio}</p>

                    <div className="about__tags">
                        <span className="about__tag">Workflow Automation</span>
                        <span className="about__tag">Generative AI</span>
                        <span className="about__tag">Prompt Engineering</span>
                        <span className="about__tag">Model Integration</span>
                        <span className="about__tag">n8n</span>
                    </div>

                </div>

            </div>
        </section>
    );
}