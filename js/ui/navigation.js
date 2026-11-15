/**
 * Navigation
 * Switching between Today, Later, Done and Settings.
 * Each view is a <div id="{name}View" class="view"> in index.html.
 */

import { renderAll } from './render.js';

let currentView = 'focus';

/** Name of the view that is showing: 'focus' | 'backlog' | 'archive' | 'settings' */
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

    // Quick capture belongs to Today only
    document.getElementById('composer').hidden = view !== 'focus';

    renderAll();
}

/** Connect the buttons in the bottom navigation. */
export function initNavigation() {
    document.querySelectorAll('.nav-btn').forEach(button => {
        button.addEventListener('click', () => switchView(button.dataset.view));
    });
}
