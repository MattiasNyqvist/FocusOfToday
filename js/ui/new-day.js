/**
 * New-day review
 * The first time the app is opened on a new day (also after a weekend or a longer break):
 *  1. Tasks that were finished earlier move to the archive.
 *  2. If focus tasks are still open, the user decides for each one:
 *     keep it in today's focus, or move it to the backlog.
 *
 * "New day" is decided by comparing today's date with the date of the last visit,
 * so it works no matter how many days have passed.
 */

import { STORAGE_KEYS } from '../config.js';
import { loadTasks, archiveFinishedTasks, readPref, writePref } from '../storage.js';
import { moveToBacklogMany } from '../actions.js';
import { notifyDataChanged } from '../events.js';

/** Local date as YYYY-MM-DD (toISOString would give the UTC date, which can be yesterday). */
function dateKey(date = new Date()) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

/** Run the new-day routine if the date has changed since the last visit. */
export function checkNewDay() {
    const dialog = document.getElementById('newDayDialog');
    if (dialog.open) return;

    const today = dateKey();
    const lastSeen = readPref(STORAGE_KEYS.lastSeenDate);

    if (!lastSeen) { // first ever visit: nothing to review
        writePref(STORAGE_KEYS.lastSeenDate, today);
        return;
    }
    if (lastSeen === today) return;

    if (archiveFinishedTasks() > 0) notifyDataChanged();

    const openFocusTasks = loadTasks().filter(t => t.starred && t.status === 'active');
    if (openFocusTasks.length === 0) {
        writePref(STORAGE_KEYS.lastSeenDate, today);
        return;
    }
    showDialog(dialog, openFocusTasks, lastSeen);
}

/** Also check when the app returns to the foreground, e.g. a phone app left open overnight. */
export function watchForNewDay() {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkNewDay();
    });
}

function showDialog(dialog, tasks, lastSeen) {
    const count = tasks.length;
    const plural = count === 1;
    const lastVisit = new Date(`${lastSeen}T00:00:00`)
        .toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' });

    dialog.querySelector('#newDayText').textContent =
        `${count} focus task${plural ? ' is' : 's are'} still open from your last visit (${lastVisit}). ` +
        `Keep ${plural ? 'it' : 'them'} in today's focus, or move ${plural ? 'it' : 'them'} to the backlog?`;

    const list = dialog.querySelector('#newDayList');
    list.replaceChildren(...tasks.map(task => createChoice(task)));

    dialog.querySelector('#newDayConfirm').onclick = () => {
        const toBacklog = [...list.querySelectorAll('input:not(:checked)')].map(box => Number(box.dataset.id));
        writePref(STORAGE_KEYS.lastSeenDate, dateKey());
        dialog.close();
        moveToBacklogMany(toBacklog);
    };

    dialog.showModal();
}

/** One row: a checkbox ("keep in focus", ticked by default) with the task text. */
function createChoice(task) {
    const item = document.createElement('li');
    const label = document.createElement('label');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.dataset.id = task.id;

    const text = document.createElement('span');
    text.textContent = task.text;

    const hint = document.createElement('small');
    hint.textContent = 'Keep in focus';
    checkbox.addEventListener('change', () => {
        hint.textContent = checkbox.checked ? 'Keep in focus' : 'Move to backlog';
    });

    label.append(checkbox, text, hint);
    item.appendChild(label);
    return item;
}
