/**
 * Toast notifications
 * Small messages at the bottom of the screen, optionally with an UNDO button.
 * Styling lives in css/styles.css (.toast).
 */

const DEFAULT_DURATION = 2000;
const UNDO_DURATION = 4000;

/** Create a toast element, add it to the page and remove it after `duration` ms. */
function showToastElement(toast, duration) {
    toast.style.animationDuration = `${duration}ms`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
}

/**
 * Show a short message.
 * @param {string} message
 * @param {number} [duration] - Milliseconds
 */
export function showToast(message, duration = DEFAULT_DURATION) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    showToastElement(toast, duration);
}

/**
 * Show a message with an UNDO button.
 * @param {string} message
 * @param {() => void} onUndo - Called if the user clicks UNDO
 * @param {number} [duration] - Milliseconds
 */
export function showToastWithUndo(message, onUndo, duration = UNDO_DURATION) {
    const toast = document.createElement('div');
    toast.className = 'toast toast-with-action';
    toast.setAttribute('role', 'status');

    const text = document.createElement('span');
    text.textContent = message;

    const undoButton = document.createElement('button');
    undoButton.type = 'button';
    undoButton.className = 'toast-action';
    undoButton.textContent = 'UNDO';
    undoButton.addEventListener('click', () => {
        onUndo();
        toast.remove();
    });

    toast.append(text, undoButton);
    showToastElement(toast, duration);
}
