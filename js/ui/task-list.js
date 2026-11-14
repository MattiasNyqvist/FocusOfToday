/**
 * Today view
 * Draws the focus list and the list of other tasks.
 *
 * Focus tasks are numbered 1..n: number 1 is done first.
 * Done tasks stay in their list for the rest of the day (struck through, at the bottom)
 * and move to the archive the next day.
 */

import { CONFIG } from '../config.js';
import { LIST, loadTasks } from '../storage.js';
import { toggleDone, toggleFocus, sendToBacklog } from '../actions.js';
import { icon } from './icons.js';
import { attachSwipe, slideOut } from './gestures.js';
import { attachDragAndDrop, previewMove, commitMove, clearPreview, VERTICAL_MOVE_THRESHOLD } from './reorder.js';
import { createIconButton, createTextElement, createEditAndDeleteButtons, createSwipeFrame } from './task-row.js';

/** Redraw both lists and the x/6 counter. */
export function renderTasks() {
    const tasks = loadTasks();

    // Sort is stable: open tasks first, done tasks last, stored order kept inside each group
    const openFirst = (a, b) => Number(a.status === 'done') - Number(b.status === 'done');
    const focusTasks = tasks.filter(t => t.starred).sort(openFirst);
    const otherTasks = tasks.filter(t => !t.starred).sort(openFirst);

    renderList('focusList', focusTasks, 'Star a task below to put it here', true);
    renderList('allTasksList', otherTasks, 'No tasks added', false);
    updateFocusCounter(focusTasks.filter(t => t.status === 'done').length);
}

/** "Finished focus tasks / daily goal", shown next to the heading. */
function updateFocusCounter(doneCount) {
    document.getElementById('focusCounter').textContent = `${doneCount}/${CONFIG.maxFocusTasks}`;
}

function renderList(containerId, tasks, emptyMessage, numbered) {
    const container = document.getElementById(containerId);
    container.replaceChildren();

    if (tasks.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.textContent = emptyMessage;
        container.appendChild(empty);
        return;
    }

    let priority = 0;
    tasks.forEach(task => {
        if (task.status !== 'done') priority++;
        container.appendChild(createTaskRow(task, numbered ? priority : null));
    });
}

/**
 * A star with a number (or check mark) inside. It is the same star the user clicked
 * to add the task to focus, so it is clear that clicking it again takes the task out.
 * Done tasks get an outlined star: filled = still to do, outlined = finished.
 */
function priorityStar(content, { done = false } = {}) {
    return `<span class="priority-badge${done ? ' priority-badge-done' : ''}" aria-hidden="true">`
        + icon('star', { size: 34, strokeWidth: done ? 1.5 : 1, filled: !done })
        + `<span class="priority-number">${content}</span></span>`;
}

/** The button at the left of a row: a priority number, a check mark or a star. */
function createLeadingButton(task, priority) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'task-star';

    if (priority === null) {
        // Other tasks: a star that adds the task to the focus list
        const label = task.starred ? 'Remove from focus' : 'Add to focus';
        button.title = label;
        button.setAttribute('aria-label', label);
        button.innerHTML = icon('star', { filled: task.starred });
    } else if (task.status === 'done') {
        // Done focus task: outlined check, not clickable (use the check button on the right)
        button.classList.add('task-priority');
        button.disabled = true;
        button.innerHTML = priorityStar('✓', { done: true });
        button.setAttribute('aria-label', 'Done');
    } else {
        // Open focus task: its priority number. Clicking removes it from focus.
        const label = `Priority ${priority} - click to remove from focus`;
        button.classList.add('task-priority');
        button.title = label;
        button.setAttribute('aria-label', label);
        button.innerHTML = priorityStar(priority);
    }

    button.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFocus(task.id);
    });
    return button;
}

function createTaskRow(task, priority) {
    const isDone = task.status === 'done';

    const row = document.createElement('div');
    row.className = 'task-item';
    row.dataset.taskId = task.id;
    row.draggable = !isDone;
    row.classList.toggle('task-done-state', isDone);

    const text = createTextElement(task);
    const doneButton = createIconButton({
        className: 'task-done' + (isDone ? ' is-done' : ''),
        label: isDone ? 'Mark as not done' : 'Mark as done',
        iconName: 'check',
        size: 22,
        onClick: () => toggleDone(task.id, row)
    });

    row.append(
        createLeadingButton(task, priority),
        text,
        doneButton,
        ...createEditAndDeleteButtons(LIST.TASKS, task, text)
    );

    const { wrapper, labelLeft, labelRight } = createSwipeFrame(row, { left: 'Done', right: 'Move to backlog' });

    // Gestures only work on open tasks. A done task is reopened with the check button.
    if (!isDone) {
        attachSwipe(row, {
            labelLeft,
            labelRight,
            onSwipeLeft: () => toggleDone(task.id, row),
            onSwipeRight: () => slideOut(row, 'right', () => sendToBacklog(task.id)),
            vertical: {
                preview: (diffY) => previewMove(wrapper, diffY),
                commit: (diffY) => commitMove(task, wrapper, diffY),
                clear: clearPreview,
                threshold: VERTICAL_MOVE_THRESHOLD
            }
        });
        attachDragAndDrop(row, task);
    }

    return wrapper;
}
