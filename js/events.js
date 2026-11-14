/**
 * Events
 * Actions change data and then announce it. main.js listens and redraws.
 * This keeps the data/action code free of any dependency on the rendering code.
 */

const DATA_CHANGED = 'focus:data-changed';

/** Call after any change to the task lists. */
export function notifyDataChanged() {
    document.dispatchEvent(new CustomEvent(DATA_CHANGED));
}

/** Run `handler` whenever task data has changed. */
export function onDataChanged(handler) {
    document.addEventListener(DATA_CHANGED, handler);
}
