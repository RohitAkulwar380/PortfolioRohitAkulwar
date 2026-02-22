/*
 * components/portfolio/Skills.tsx
 * ────────────────────────────────
 * Displays technical and soft skills in an elegant two-column layout.
 */

import type { Skills as SkillsType } from '../../types';
import './Skills.css';

interface SkillsProps {
    skills: SkillsType;
    setIsChatMinimized: (isMinimized: boolean) => void;
    setActiveTab: (tab: 'portfolio' | 'chat') => void;
    sendMessage: (text: string) => Promise<void>;
}

// Map skill names to conceptual categories for the right-hand column label
function getCategoryLabel(skill: string, type: 'technical' | 'soft'): string {
    if (type === 'soft') return 'Soft';
    if (skill.toLowerCase().includes('python') || skill.toLowerCase().includes('java') || skill.toLowerCase().includes('kotlin')) return 'Language';
    if (skill.toLowerCase().includes('mysql')) return 'Database';
    if (skill.toLowerCase().includes('react') || skill.toLowerCase().includes('html')) return 'Frontend';
    if (skill.toLowerCase().includes('n8n') || skill.toLowerCase().includes('git')) return 'Tooling';
    if (skill.toLowerCase().includes('prompt engineering') || skill.toLowerCase().includes('ai')) return 'AI';
    if (skill.toLowerCase().includes('django') || skill.toLowerCase().includes('node')) return 'Backend';
    return 'Framework';
}

function SkillColumn({ title, items, type }: { title: string; items: string[]; type: 'technical' | 'soft' }) {
    // Only display top 5 items
    const displayItems = items.slice(0, 5);

    return (
        <div className="skills__column">
            <h3 className="skills__column-title">{title}</h3>
            <div className="skills__list-container">
                <ul className="skills__list" role="list">
                    {displayItems.map((skill, index) => (
                        <li key={`${skill}-${index}`} className="skills__list-item">
                            <span className="skills__item-name">{skill}</span>
                            <span className="skills__item-category">{getCategoryLabel(skill, type)}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default function Skills({ skills, setIsChatMinimized, setActiveTab, sendMessage }: SkillsProps) {
    const handlePromptClick = (prompt: string) => {
        setIsChatMinimized(false);
        setActiveTab('chat');
        sendMessage(prompt);
    };

    return (
        <section className="skills section fade-in-item" id="skills" aria-labelledby="skills-heading">
            <p className="section-eyebrow" id="skills-heading">Skills</p>
            <h2 className="skills__headline">What I<br /><em>work with.</em></h2>

            <div className="skills__layout">
                <SkillColumn title="Technical" items={skills.technical} type="technical" />
                <SkillColumn title="Specialisations" items={skills.soft} type="soft" />
            </div>

            <div className="skills__action">
                <button
                    className="skills__ask-btn"
                    onClick={(e) => {
                        e.preventDefault();
                        handlePromptClick("Describe your skills");
                    }}
                >
                    <span className="prompt-text">Learn more about skills</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </button>
            </div>
        </section>
    );
}
