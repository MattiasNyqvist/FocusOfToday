/**
 * Backlog and Archive views
 * Both lists look alike: a row with the task text, an edit and a delete button,
 * and a swipe to the left that moves the task back to Today.
 */

import { LIST, loadBacklog, loadArchive } from '../storage.js';
import { returnToToday } from '../actions.js';
import { icon } from './icons.js';
import { attachSwipe, slideOut } from './gestures.js';
import { createTextElement, createEditAndDeleteButtons, createSwipeFrame } from './task-row.js';

export function renderBacklog() {
    const emptyContent = document.createElement('span');
    emptyContent.innerHTML = icon('box', { inline: true }) + ' Nothing parked for later.';

    renderSimpleList({
        containerId: 'backlogList',
        list: LIST.BACKLOG,
        tasks: loadBacklog(),
        rowClass: 'backlog-task-item',
        emptyContent
    });
}

export function renderArchive() {
    // Newest first
    const tasks = [...loadArchive()].sort((a, b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime());

    renderSimpleList({
        containerId: 'archiveList',
        list: LIST.ARCHIVE,
        tasks,
        rowClass: 'archive-task-item',
        emptyContent: 'No completed tasks archived yet.',
        createLeading: (task) => {
            const date = document.createElement('div');
            date.className = 'archive-date';
            const when = new Date(task.archivedAt);
            date.textContent =
                `${when.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} ` +
                when.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
            return date;
        }
    });
}

/**
 * @param {Object} options
 * @param {string} options.containerId
 * @param {string} options.list - LIST.BACKLOG or LIST.ARCHIVE
 * @param {Object[]} options.tasks
 * @param {string} options.rowClass - Extra class for the row
 * @param {string|Node} options.emptyContent - Shown when there are no tasks
 * @param {(task: Object) => HTMLElement} [options.createLeading] - Optional element before the text
 */
function renderSimpleList({ containerId, list, tasks, rowClass, emptyContent, createLeading }) {
    const container = document.getElementById(containerId);
    container.replaceChildren();

    if (tasks.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.append(emptyContent);
        container.appendChild(empty);
        return;
    }

    tasks.forEach(task => {
        const row = document.createElement('div');
        row.className = `task-item ${rowClass}`;

        const text = createTextElement(task);
        row.append(
            ...(createLeading ? [createLeading(task)] : []),
            text,
            ...createEditAndDeleteButtons(list, task, text)
        );

        const { wrapper, labelLeft } = createSwipeFrame(row, { left: 'Move to today' });
        attachSwipe(row, {
            labelLeft,
            onSwipeLeft: () => slideOut(row, 'left', () => returnToToday(list, task.id))
        });
        container.appendChild(wrapper);
    });
}
