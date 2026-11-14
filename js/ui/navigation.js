/**
 * Navigation
 * Switching between Today, Backlog, Archive, Help and Settings.
 * Each view is a <div id="{name}View" class="view"> in index.html.
 */

import { renderAll } from './render.js';
import { showAssistantFor } from './assistant.js';

let currentView = 'focus';

/** Name of the view that is showing: 'focus' | 'backlog' | 'archive' | 'guide' | 'settings' */
export function getCurrentView() {
    return currentView;
}

/** Show a view and mark its button in the bottom navigation. */
export function switchView(view) {
    currentView = view;

    document.querySelectorAll('.view').forEach(el => {
        el.classList.toggle('active', el.id === `${view}View`);
    });
    document.querySelectorAll('.nav-btn').forEach(button => {
        const isActive = button.dataset.view === view;
        button.classList.toggle('active', isActive);
        if (isActive) button.setAttribute('aria-current', 'page');
        else button.removeAttribute('aria-current');
    });

    renderAll();
    showAssistantFor(view);
}

/** Connect the buttons in the bottom navigation. */
export function initNavigation() {
    document.querySelectorAll('.nav-btn').forEach(button => {
        button.addEventListener('click', () => switchView(button.dataset.view));
    });
}
