/**
 * Later (backlog) and Done (archive) views
 * Both lists look alike: a row with the task text, a button to move it back to
 * Today and a "..." menu (edit, delete). Swiping a row to the left also moves it back to Today.
 */

import { LIST, loadBacklog, loadArchive } from '../storage.js';
import { returnToToday } from '../actions.js';
import { icon } from './icons.js';
import { attachSwipe, slideOut } from './gestures.js';
import { createIconButton, createTextElement, createRowMenu, createSwipeFrame } from './task-row.js';

export function renderBacklog() {
    const emptyContent = document.createElement('span');
    emptyContent.innerHTML = icon('box', { inline: true }) + ' Nothing here yet. Send a task here from the \u22EF menu or by swiping it right.';

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
        emptyContent: 'Nothing done yet. Finished tasks arrive here the day after.',
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
            createIconButton({
                className: 'task-move',
                label: 'Move to Today',
                iconName: 'arrowLeft',
                onClick: () => returnToToday(list, task.id)
            }),
            createRowMenu(list, task, text)
        );

        const { wrapper, labelLeft } = createSwipeFrame(row, { left: 'Move to Today' });
        attachSwipe(row, {
            labelLeft,
            onSwipeLeft: () => slideOut(row, 'left', () => returnToToday(list, task.id))
        });
        container.appendChild(wrapper);
    });
}
