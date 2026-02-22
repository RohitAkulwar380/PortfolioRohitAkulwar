/*
 * components/portfolio/Projects.tsx
 * ───────────────────────────────────
 * Displays project cards with hover-to-play video integration.
 */

import { useRef, useState } from 'react';
import type { Project } from '../../types';
import { motion } from 'framer-motion';
import './Projects.css';

interface ProjectCardProps {
    project: Project;
    index: number;
    setIsChatMinimized: (isMinimized: boolean) => void;
    setActiveTab: (tab: 'portfolio' | 'chat') => void;
    sendMessage: (text: string) => Promise<void>;
}

function ProjectCard({ project, index, sendMessage, setIsChatMinimized, setActiveTab }: ProjectCardProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleAskAI = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsChatMinimized(false);
        setActiveTab('chat');
        sendMessage(`Tell me more about your work on ${project.title}`);
    };

    // ── Hover Video Logic ──
    const handleMouseEnter = () => {
        if (videoRef.current) {
            // The .catch() prevents console errors if the user mouses out 
            // before the play promise has time to resolve.
            videoRef.current.play().catch(() => { });
        }
    };

    const handleMouseLeave = () => {
        if (videoRef.current) {
            videoRef.current.pause();
            // Optional: reset video to beginning on mouse leave
            // videoRef.current.currentTime = 0; 
        }
    };

    const toggleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    const isRightItem = index % 2 !== 0;
    const baseOrder = index * 2;
    // If it's the right item and expanded, we want it to jump *just* before its left-side sibling
    const expandedOrder = isRightItem ? baseOrder - 3 : baseOrder;
    const currentOrder = isExpanded ? expandedOrder : baseOrder;

    return (
        <motion.article
            layout
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, type: 'spring', bounce: 0.2 }}
            className={`project-card group ${isExpanded ? 'project-card--expanded' : ''}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
                zIndex: isExpanded ? 10 : 1,
                '--card-order': currentOrder
            } as React.CSSProperties}
        >
            {/* ── Media Header (Video/Image) ── */}
            <motion.div layout className="project-card__media">
                {/* Fallback color/placeholder if no media is provided */}
                <div className="project-card__media-placeholder" />

                {(project.videoUrl || project.posterUrl) && (
                    <video
                        ref={videoRef}
                        src={project.videoUrl}
                        poster={project.posterUrl}
                        muted
                        loop
                        playsInline
                        className="project-card__video"
                    />
                )}

                {/* AI Hover Prompt overlaid on the media */}
                <div
                    className="project-card__hover-prompt"
                    aria-hidden="true"
                    onClick={handleAskAI}
                    role="button"
                    tabIndex={0}
                >
                    <span className="prompt-text">Ask the Resume AI</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </div>

                {/* Expand / Collapse Button */}
                <button
                    className="project-card__expand-btn"
                    onClick={toggleExpand}
                    aria-label={isExpanded ? "Collapse project" : "Expand project"}
                >
                    {isExpanded ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="4 14 10 14 10 20"></polyline>
                            <polyline points="20 10 14 10 14 4"></polyline>
                            <line x1="14" y1="10" x2="21" y2="3"></line>
                            <line x1="3" y1="21" x2="10" y2="14"></line>
                        </svg>
                    ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <polyline points="9 21 3 21 3 15"></polyline>
                            <line x1="21" y1="3" x2="14" y2="10"></line>
                            <line x1="3" y1="21" x2="10" y2="14"></line>
                        </svg>
                    )}
                    <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
                </button>
            </motion.div>

            {/* ── Text Content Footer ── */}
            <motion.div layout="position" className="project-card__content">
                <h3 className="project-card__title">{project.title}</h3>
                <motion.p layout="position" className="project-card__description">{project.description}</motion.p>
                <motion.ul layout="position" className="project-card__tags" role="list">
                    {project.technologies.map((tech) => (
                        <li key={tech} className="project-card__tag">
                            {tech}
                        </li>
                    ))}
                </motion.ul>
            </motion.div>
        </motion.article>
    );
}

interface ProjectsProps {
    projects: Project[];
    setIsChatMinimized: (isMinimized: boolean) => void;
    setActiveTab: (tab: 'portfolio' | 'chat') => void;
    sendMessage: (text: string) => Promise<void>;
}

export default function Projects({ projects, setIsChatMinimized, setActiveTab, sendMessage }: ProjectsProps) {
    return (
        <section
            className="projects section fade-in-item"
            id="projects"
            aria-labelledby="projects-heading"
        >
            <p className="section-eyebrow" id="projects-heading">Projects</p>
            <h2 className="projects__headline">Things<br /><em>I've built.</em></h2>
            <motion.div layout className="projects__grid">
                {projects.map((project, index) => (
                    <ProjectCard
                        key={project.title}
                        project={project}
                        index={index}
                        sendMessage={sendMessage}
                        setIsChatMinimized={setIsChatMinimized}
                        setActiveTab={setActiveTab}
                    />
                ))}
            </motion.div>
        </section>
    );
}