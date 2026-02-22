/*
 * components/portfolio/Contact.tsx
 */

import type { PersonalInfo } from '../../types';
import './Contact.css';

interface ContactProps {
    personal: PersonalInfo;
}

const contactLinks = (personal: PersonalInfo) => [
    { label: 'Email', href: `mailto:${personal.email}`, display: personal.email },
    { label: 'LinkedIn', href: personal.linkedin, display: 'linkedin.com/in/RohitAkulwar380' },
    { label: 'GitHub', href: personal.github, display: 'github.com/RohitAkulwar380' },
];

export default function Contact({ personal }: ContactProps) {
    return (
        <section className="contact section fade-in-item" id="contact" aria-labelledby="contact-heading">
            <p className="section-eyebrow" id="contact-heading">Contact</p>
            <h2 className="contact-a__headline">Let's build something<br /><em>worth talking about.</em></h2>

            <div className="contact-a__links">
                {contactLinks(personal).map(({ label, href, display }) => (
                    <a
                        key={label}
                        href={href}
                        target={href.startsWith('mailto') ? undefined : '_blank'}
                        rel={href.startsWith('mailto') ? undefined : 'noopener noreferrer'}
                        className="contact-a__link"
                    >
                        <span className="contact-a__type">{label}</span>
                        <span className="contact-a__value">{display}</span>
                        <span className="contact-a__arrow">→</span>
                    </a>
                ))}
            </div>
        </section>
    );
}