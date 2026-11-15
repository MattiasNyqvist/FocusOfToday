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
import { icon, numberedStar } from './icons.js';
import { attachSwipe, slideOut } from './gestures.js';
import { attachDragAndDrop, previewMove, commitMove, clearPreview, VERTICAL_MOVE_THRESHOLD } from './reorder.js';
import { createIconButton, createTextElement, createEditAndDeleteButtons, createSwipeFrame } from './task-row.js';

/** Redraw both lists and the counter next to the focus heading. */
export function renderTasks() {
    const tasks = loadTasks();

    // Sort is stable: open tasks first, done tasks last, stored order kept inside each group
    const openFirst = (a, b) => Number(a.status === 'done') - Number(b.status === 'done');
    const focusTasks = tasks.filter(t => t.starred).sort(openFirst);
    const otherTasks = tasks.filter(t => !t.starred).sort(openFirst);

    renderList('focusList', focusTasks, 'Star a task below to put it here', true);
    renderList('allTasksList', otherTasks, 'No tasks added', false);
    updateFocusCounter(focusTasks.filter(t => t.status === 'done').length, focusTasks.length);
}

/** "Done / chosen (max N)", shown next to the heading, for example "1/5 (max 6)". */
function updateFocusCounter(doneCount, chosenCount) {
    const counter = document.getElementById('focusCounter');
    const max = document.createElement('span');
    max.textContent = ` (max ${CONFIG.maxFocusTasks})`;
    counter.replaceChildren(`${doneCount}/${chosenCount}`, max);
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
        button.innerHTML = numberedStar('✓', { done: true });
        button.setAttribute('aria-label', 'Done');
    } else {
        // Open focus task: its priority number. Clicking removes it from focus.
        const label = `Priority ${priority} - click to remove from focus`;
        button.classList.add('task-priority');
        button.title = label;
        button.setAttribute('aria-label', label);
        button.innerHTML = numberedStar(priority);
    }

    button.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFocus(task.id);
    });
    return button;
}

/** Six dots at the left edge of a row: the task can be dragged up or down. */
function createGrip() {
    const grip = document.createElement('span');
    grip.className = 'task-grip';
    grip.title = 'Drag to reorder';
    grip.innerHTML = icon('grip', { size: 12, strokeWidth: 3.5 });
    return grip;
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

    // Open tasks can be dragged (the grip shows it) and moved to the backlog with a button.
    // A done task is reopened with the check button first.
    const openTaskParts = isDone ? [] : [
        createIconButton({
            className: 'task-move',
            label: 'Move to backlog',
            iconName: 'box',
            onClick: () => sendToBacklog(task.id)
        })
    ];

    row.append(
        ...(isDone ? [] : [createGrip()]),
        createLeadingButton(task, priority),
        text,
        doneButton,
        ...openTaskParts,
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
