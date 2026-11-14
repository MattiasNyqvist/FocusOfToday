/**
 * Celebration
 * A small burst of confetti shown when a task is completed.
 */

const COLORS = ['#4A90E2', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0'];
const PARTICLE_COUNT = 15;
const DURATION_MS = 600;

/**
 * Burst confetti from the center of an element.
 * @param {HTMLElement} element
 */
export function showCelebration(element) {
    // Respect users who have asked their system for less motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const particle = document.createElement('div');
        particle.className = 'confetti-particle';
        particle.style.left = `${centerX}px`;
        particle.style.top = `${centerY}px`;
        particle.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
        document.body.appendChild(particle);

        // Spread evenly around a circle, with a random distance
        const angle = (Math.PI * 2 * i) / PARTICLE_COUNT;
        const distance = 100 + Math.random() * 100;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;

        particle.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${x}px, ${y}px) scale(0)`, opacity: 0 }
        ], {
            duration: DURATION_MS,
            easing: 'cubic-bezier(0, .9, .57, 1)'
        }).onfinish = () => particle.remove();
    }
}
