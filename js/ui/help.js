/**
 * Help ("How it works")
 * A short explanation in a dialog. It is opened from the ? next to the focus heading and
 * from Settings. It replaces the step-by-step guide: the interface is meant to explain
 * itself, and this is only a place to look things up.
 */

import { CONFIG } from '../config.js';

/** Connect the buttons that open and close the help dialog. Call once at start. */
export function initHelp() {
    const dialog = document.getElementById('helpDialog');

    const open = () => {
        // The limit can be changed in Settings, so it is filled in each time
        dialog.querySelector('.help-max').textContent = String(CONFIG.maxFocusTasks);
        dialog.showModal();
    };

    document.getElementById('helpBtn').addEventListener('click', open);
    document.getElementById('openHelpBtn').addEventListener('click', open);
    document.getElementById('helpClose').addEventListener('click', () => dialog.close());

    // A click on the dimmed area around the dialog closes it too
    dialog.addEventListener('click', (event) => {
        if (event.target === dialog) dialog.close();
    });
}
