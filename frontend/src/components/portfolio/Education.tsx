/*
 * components/portfolio/Education.tsx
 */

import type { Education as EducationType } from '../../types';
import './Education.css';

interface EducationProps {
    education: EducationType[];
}

export default function Education({ education }: EducationProps) {
    return (
        <section className="education section fade-in-item" id="education" aria-labelledby="education-heading">
            <p className="section-eyebrow" id="education-heading">Education</p>
            <h2 className="edu-c__headline fade-in-item">Where I<br /><em>studied.</em></h2>
            <div className="edu-c__grid">
                {education.map((item, index) => {
                    // Extract numeric value (e.g., "8.08")
                    const numMatch = item.score.match(/[\d.]+/);
                    const numValue = numMatch ? numMatch[0] : item.score;

                    // Remove the number, AND remove any colons, then trim to get just "CGPA" or "%"
                    const unitValue = item.score.replace(numValue, '').replace(/:/g, '').trim();

                    // Clean dates: remove "08/" or "05/" month formats to just show years
                    const cleanDates = item.dates.replace(/\d{1,2}\//g, '');

                    // Mute older education entries (index >= 2)
                    const isMuted = index >= 2;

                    return (
                        <div key={item.degree} className={`edu-c__item ${isMuted ? 'edu-c__item--muted' : ''}`}>
                            <div className="edu-c__num">{numValue}</div>
                            <div className="edu-c__degree">{item.degree}</div>
                            <div className="edu-c__inst">{item.institution}</div>
                            <div className="edu-c__meta">
                                <span className="edu-c__date">{cleanDates}</span>
                                <span className="edu-c__score">{unitValue}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}