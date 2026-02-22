import { useState, useEffect } from 'react';

/**
 * useTypewriter
 * 
 * A custom hook that cycles through a list of words, typing and deleting
 * them character by character.
 * 
 * @param words Array of strings to cycle through
 * @param typingSpeed Speed of typing in ms per character
 * @param deletingSpeed Speed of deleting in ms per character
 * @param pauseTime Time to pause when a word is fully typed (in ms)
 * @param initialDelay Time to wait before starting the very first word (in ms)
 * @returns The current string slice to display
 */
export function useTypewriter(
    words: string[],
    typingSpeed: number = 80,
    deletingSpeed: number = 50,
    pauseTime: number = 2000,
    initialDelay: number = 0
) {
    const [wordIndex, setWordIndex] = useState(0);
    const [text, setText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);

    // Handle initial delay
    useEffect(() => {
        if (initialDelay > 0) {
            const timer = setTimeout(() => setHasStarted(true), initialDelay);
            return () => clearTimeout(timer);
        } else {
            setHasStarted(true);
        }
    }, [initialDelay]);

    useEffect(() => {
        if (!hasStarted || !words || words.length === 0) return;

        const currentWord = words[wordIndex];
        let timeout: ReturnType<typeof setTimeout>;

        if (isDeleting) {
            // Typing mode: Delete character
            timeout = setTimeout(() => {
                setText(currentWord.substring(0, text.length - 1));
            }, deletingSpeed);
        } else {
            // Typing mode: Add character
            timeout = setTimeout(() => {
                setText(currentWord.substring(0, text.length + 1));
            }, typingSpeed);
        }

        // Handle state transitions
        if (!isDeleting && text === currentWord) {
            // Finished typing the word, pause before deleting
            clearTimeout(timeout);
            timeout = setTimeout(() => setIsDeleting(true), pauseTime);
        } else if (isDeleting && text === '') {
            // Finished deleting, move to next word
            clearTimeout(timeout);
            setIsDeleting(false);
            setWordIndex((prev) => (prev + 1) % words.length);
        }

        return () => clearTimeout(timeout);
    }, [text, isDeleting, wordIndex, words, typingSpeed, deletingSpeed, pauseTime, hasStarted]);

    return text;
}
