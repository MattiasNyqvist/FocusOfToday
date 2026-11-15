/**
 * Help dialogs
 *  - "How it works": a short explanation of the app. Opened from the ? next to the focus heading
 *    and from Settings.
 *  - "The Ivy Lee Method": the method itself, not the app. Opened from the link in the tagline,
 *    which is in the header of every view.
 * They replace the step-by-step guide: the interface is meant to explain itself, and these
 * are only places to look things up.
 */

import { CONFIG } from '../config.js';

/** Close a dialog when the dimmed area around it is clicked. */
function closeOnBackdropClick(dialog) {
    dialog.addEventListener('click', (event) => {
        if (event.target === dialog) dialog.close();
    });
}

/** Connect the buttons that open and close the help dialogs. Call once at start. */
export function initHelp() {
    // --- How it works ---
    const helpDialog = document.getElementById('helpDialog');

    const openHelp = () => {
        // The limit can be changed in Settings, so it is filled in each time
        helpDialog.querySelector('.help-max').textContent = String(CONFIG.maxFocusTasks);
        helpDialog.showModal();
    };

    document.getElementById('helpBtn').addEventListener('click', openHelp);
    document.getElementById('openHelpBtn').addEventListener('click', openHelp);
    document.getElementById('helpClose').addEventListener('click', () => helpDialog.close());
    closeOnBackdropClick(helpDialog);

    // --- The Ivy Lee Method ---
    // The header (and so the link) exists once in every view
    const methodDialog = document.getElementById('methodDialog');

    document.querySelectorAll('.method-link').forEach(link =>
        link.addEventListener('click', () => methodDialog.showModal()));
    document.getElementById('methodClose').addEventListener('click', () => methodDialog.close());
    closeOnBackdropClick(methodDialog);
}
