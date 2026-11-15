/**
 * Assistant
 * The step-by-step help box at the top of Today, Backlog and Archive.
 * Today has several steps the user can page through with < and >;
 * the other views have a single message.
 *
 * Every view has its own copy of the box (see components.js). All copies show the
 * same content, so whichever view is visible is always up to date.
 */

import { CONFIG, STORAGE_KEYS } from '../config.js';
import { readPref, writePref } from '../storage.js';
import { icon, numberedStar } from './icons.js';

/** An icon sized to sit inside a sentence. */
const inlineIcon = (name) => icon(name, { size: 18, inline: true });

/** The six-dot drag handle, as it looks on the task rows. */
const gripIcon = icon('grip', { size: 18, strokeWidth: 3, inline: true });

/** The numbered star of the priority list, sized to sit inside a sentence. */
const inlineStar = (number) => numberedStar(number, { size: 24, inline: true });

/**
 * The content of each view. A step is { title?, text } where text may contain HTML.
 * A step with a title is shown in bold above its text. Views that are missing here
 * (Help, Settings) have no assistant box.
 *
 * Keep every step short: the box is exactly three lines high (see css/styles.css).
 * The "Step-by-step guide" title is fixed markup in the box itself.
 */
const STEPS = {
    focus: () => [
        {
            title: 'Brainstorm',
            text: `Write down everything on your mind for today's to-dos. Click ${inlineIcon('plus')} to add each task.`
        },
        {
            title: 'Prioritise',
            text: `Click ${inlineIcon('star')} on your top tasks (max ${CONFIG.maxFocusTasks}). Drag ${gripIcon} to order them, with ${inlineStar(1)} on top.`
        },
        {
            title: 'Act',
            text: `Start with ${inlineStar(1)}. Click ${inlineIcon('check')} when done (click again to undo).`
        },
        {
            title: 'Tidy up',
            text: `Not today? Click ${inlineIcon('box')} or <strong>swipe right</strong> to send a task to the backlog. ${inlineIcon('pen')} edits, ${inlineIcon('trash')} deletes.`
        },
        {
            title: 'Next day',
            text: 'Done tasks move to the Archive tomorrow. Unfinished focus tasks are reviewed then.'
        }
    ],
    backlog: () => [{
        text: `Tasks for later. Click ${inlineIcon('arrowLeft')} or <strong>swipe left</strong> to move one back to Today. Click ${inlineIcon('pen')} to edit or ${inlineIcon('trash')} to delete.`
    }],
    archive: () => [{
        text: `Finished tasks arrive here the day after. Click ${inlineIcon('arrowLeft')} or <strong>swipe left</strong> to move one back to Today. ${inlineIcon('pen')} edits, ${inlineIcon('trash')} deletes.`
    }]
};

/** The view shown now, and the step the user is on in each view (remembered until reload). */
let activeView = 'focus';
const stepIndex = {};

const sections = () => document.querySelectorAll('.assistant-section');
const getSteps = (view) => (STEPS[view] ? STEPS[view]() : []);

/** A numbered button that jumps to a step; the current step is highlighted. */
function stepButton(step, i, isCurrent) {
    const label = `Step ${i + 1}: ${step.title}`;
    return `<button type="button" class="assistant-step-btn${isCurrent ? ' active' : ''}" `
        + `data-step="${i}" aria-label="${label}"${isCurrent ? ' aria-current="step"' : ''}>${i + 1}</button>`;
}

/**
 * Draw the current step into every assistant box.
 * @param {'left'|'right'|null} direction - Which side the step slides in from (null = no animation)
 */
function render(direction = null) {
    const steps = getSteps(activeView);
    const index = Math.min(stepIndex[activeView] || 0, steps.length - 1);
    stepIndex[activeView] = index;

    const step = steps[index];
    const html = (step.title ? `<strong>${step.title}</strong><br>` : '') + step.text;
    const hasSeveralSteps = steps.length > 1;

    sections().forEach(section => {
        const slide = section.querySelector('.assistant-slide');
        section.querySelector('.assistant-message').innerHTML = html;

        // Hidden (not removed) on single-step views so the box keeps its height
        section.querySelector('.assistant-nav').style.visibility = hasSeveralSteps ? 'visible' : 'hidden';
        section.querySelector('.assistant-prev').disabled = index === 0;
        section.querySelector('.assistant-next').disabled = index === steps.length - 1;
        section.querySelector('.assistant-steps').innerHTML = hasSeveralSteps
            ? steps.map((step, i) => stepButton(step, i, i === index)).join('')
            : '';

        slide.classList.remove('slide-in-left', 'slide-in-right');
        if (direction) {
            void slide.offsetWidth; // force a reflow so the animation restarts
            slide.classList.add(direction === 'right' ? 'slide-in-right' : 'slide-in-left');
        }
    });
}

/** Go to a step (clamped to the valid range) in the current view. */
function goToStep(target) {
    const steps = getSteps(activeView);
    const current = stepIndex[activeView] || 0;
    const next = Math.max(0, Math.min(steps.length - 1, target));
    if (next === current) return;

    stepIndex[activeView] = next;
    render(next > current ? 'right' : 'left');
}

const currentStep = () => stepIndex[activeView] || 0;

/** True unless the user has turned the assistant off. */
export function isAssistantVisible() {
    return readPref(STORAGE_KEYS.assistantHidden) !== 'true';
}

/** Show or hide the assistant everywhere and remember the choice. */
export function setAssistantVisible(visible) {
    writePref(STORAGE_KEYS.assistantHidden, !visible);
    sections().forEach(section => section.classList.toggle('hidden', !visible));

    // Keep the checkbox in Settings in step with the close button (x) in the box
    const checkbox = document.getElementById('showAssistant');
    if (checkbox) checkbox.checked = visible;
}

/**
 * Show the assistant content for a view. Cheap to call often: the box is only redrawn
 * when the view changes, so the user never loses their place in the steps.
 * @param {string} view
 */
export function showAssistantFor(view) {
    const visible = isAssistantVisible();
    sections().forEach(section => section.classList.toggle('hidden', !visible));
    if (!visible || !STEPS[view]) return;

    const viewChanged = view !== activeView;
    activeView = view;
    if (viewChanged || !document.querySelector('.assistant-message').innerHTML) {
        render(viewChanged ? 'right' : null);
    }
}

/** Connect the buttons in the assistant boxes. Call once, after the boxes exist. */
export function initAssistant() {
    document.querySelectorAll('.assistant-close').forEach(button =>
        button.addEventListener('click', () => setAssistantVisible(false)));
    document.querySelectorAll('.assistant-prev').forEach(button =>
        button.addEventListener('click', () => goToStep(currentStep() - 1)));
    document.querySelectorAll('.assistant-next').forEach(button =>
        button.addEventListener('click', () => goToStep(currentStep() + 1)));
    document.querySelectorAll('.assistant-steps').forEach(container =>
        container.addEventListener('click', (event) => {
            const button = event.target.closest('[data-step]');
            if (button) goToStep(Number(button.dataset.step));
        }));
}
