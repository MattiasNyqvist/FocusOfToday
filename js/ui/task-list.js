/**
 * Today view
 * Draws today's focus (a fixed number of places) and the list "Everything else" below it.
 *
 * Focus tasks are numbered 1..n: number 1 is done first. Places that are still free are
 * drawn as empty numbered slots, so the daily limit is visible before it is reached.
 * Tasks on the "Everything else" list are waiting to be picked.
 * Done tasks stay in their list for the rest of the day (struck through, at the bottom)
 * and move to Done the next day.
 */

import { CONFIG } from '../config.js';
import { LIST, loadTasks, canAddFocusTask } from '../storage.js';
import { toggleDone, toggleFocus, sendToBacklog } from '../actions.js';
import { icon, numberedStar } from './icons.js';
import { attachSwipe, slideOut } from './gestures.js';
import { attachDragAndDrop, previewMove, commitMove, clearPreview, VERTICAL_MOVE_THRESHOLD } from './reorder.js';
import { createIconButton, createTextElement, createEditAndDeleteButtons, createSwipeFrame } from './task-row.js';
import { openSwapDialog } from './swap-dialog.js';

/** Redraw the focus list, the "Everything else" list and the counter next to the focus heading. */
export function renderTasks() {
    const tasks = loadTasks();

    // Sort is stable: open tasks first, done tasks last, stored order kept inside each group
    const openFirst = (a, b) => Number(a.status === 'done') - Number(b.status === 'done');
    const focusTasks = tasks.filter(t => t.starred).sort(openFirst);
    const onYourMind = tasks.filter(t => !t.starred).sort(openFirst);

    renderFocusList(focusTasks);
    renderOnYourMind(onYourMind);
    updateFocusCounter(focusTasks.filter(t => t.status === 'done').length, focusTasks.length);
    updateFocusPrompt(focusTasks.length, onYourMind.length);
}

/** "Done / chosen (max N)", for example "1/5 (max 6)". Before anything is chosen: "(max 6)". */
function updateFocusCounter(doneCount, chosenCount) {
    const counter = document.getElementById('focusCounter');
    const max = document.createElement('span');
    max.textContent = chosenCount > 0 ? ` (max ${CONFIG.maxFocusTasks})` : `(max ${CONFIG.maxFocusTasks})`;
    counter.replaceChildren(...(chosenCount > 0 ? [`${doneCount}/${chosenCount}`] : []), max);
}

/** The question under the heading. It is only there until the first task is picked. */
function updateFocusPrompt(chosenCount, waitingCount) {
    const prompt = document.getElementById('focusPrompt');
    prompt.hidden = chosenCount > 0;
    prompt.textContent = waitingCount === 0
        ? `What matters most today? Write your tasks below, then pick up to ${CONFIG.maxFocusTasks}.`
        : `What matters most today? Pick up to ${CONFIG.maxFocusTasks} tasks from the list below.`;
}

/** The chosen tasks, followed by one empty slot for every place that is still free. */
function renderFocusList(tasks) {
    const container = document.getElementById('focusList');
    container.replaceChildren();

    let priority = 0;
    tasks.forEach(task => {
        if (task.status !== 'done') priority++;
        container.appendChild(createTaskRow(task, priority));
    });

    for (let slot = tasks.length + 1; slot <= CONFIG.maxFocusTasks; slot++) {
        container.appendChild(createEmptySlot(slot));
    }
}

function renderOnYourMind(tasks) {
    const container = document.getElementById('allTasksList');
    container.replaceChildren();
    document.getElementById('brainDumpCount').textContent = tasks.length > 0 ? `(${tasks.length})` : '';

    if (tasks.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.textContent = 'Nothing here yet. Add your tasks below, then choose what matters today.';
        container.appendChild(empty);
        return;
    }

    tasks.forEach(task => container.appendChild(createTaskRow(task, null)));
}

/** Scroll to the "Everything else" list, and start typing if it is empty. */
function goToWaitingList() {
    const section = document.getElementById('brainDumpSection');
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (!section.querySelector('.task-item')) {
        document.getElementById('taskInput').focus({ preventScroll: true });
    }
}

/** A free place in today's focus. Tapping it leads to where tasks are picked. */
function createEmptySlot(number) {
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = 'focus-slot';
    slot.setAttribute('aria-label', `Free place ${number} in today's focus. Pick a task from the list below.`);
    slot.innerHTML = numberedStar(number, { empty: true }) + '<span class="focus-slot-text">Pick a task</span>';
    slot.addEventListener('click', goToWaitingList);
    return slot;
}

/** Put a task in today's focus. If the focus is full the user chooses which task to swap out. */
function pickTask(task) {
    if (canAddFocusTask()) {
        toggleFocus(task.id);
    } else {
        openSwapDialog(task);
    }
}

/** The button at the left of a focus row: a priority number or a faded star with a check. */
function createLeadingButton(task, priority) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'task-star task-priority';

    if (task.status === 'done') {
        // Done focus task: not clickable (use the check button on the right to undo)
        button.disabled = true;
        button.innerHTML = numberedStar('✓', { done: true });
        button.setAttribute('aria-label', 'Done');
    } else {
        // Open focus task: its priority number. Clicking takes it out of focus.
        const label = `Number ${priority} - click to take it out of today's focus`;
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

/** "Focus": puts a task from "Everything else" in today's focus. */
function createPickButton(task) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'task-pick';
    button.title = "Add to today's focus";
    button.setAttribute('aria-label', `Add "${task.text}" to today's focus`);
    button.innerHTML = icon('star', { size: 14, strokeWidth: 2 }) + '<span>Focus</span>';
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        pickTask(task);
    });
    return button;
}

/** Six dots at the left edge of a row: the task can be dragged up or down. */
function createGrip() {
    const grip = document.createElement('span');
    grip.className = 'task-grip';
    grip.title = 'Drag to reorder';
    grip.innerHTML = icon('grip', { size: 14, strokeWidth: 4.5 });
    return grip;
}

/**
 * One row. `priority` is the task's number in today's focus, or null for a task on the "Everything else" list.
 */
function createTaskRow(task, priority) {
    const isDone = task.status === 'done';
    const isFocus = priority !== null;

    const row = document.createElement('div');
    row.className = 'task-item';
    row.dataset.taskId = task.id;
    row.draggable = !isDone;
    row.classList.toggle('task-done-state', isDone);

    const text = createTextElement(task);

    // Only focus tasks are worked on, so only they get a check button. A waiting task that is
    // already done (from an older version) keeps one so it can be reopened.
    const doneButton = (isFocus || isDone) ? [createIconButton({
        className: 'task-done' + (isDone ? ' is-done' : ''),
        label: isDone ? 'Mark as not done' : 'Mark as done',
        iconName: 'check',
        size: 22,
        onClick: () => toggleDone(task.id, row)
    })] : [];

    // Open tasks can be dragged (the grip shows it) and sent to Later with a button.
    const openTaskParts = isDone ? [] : [
        ...(isFocus ? [] : [createPickButton(task)]),
        createIconButton({
            className: 'task-move',
            label: 'Move to Later',
            iconName: 'box',
            onClick: () => sendToBacklog(task.id)
        })
    ];

    row.append(
        ...(isDone ? [] : [createGrip()]),
        ...(isFocus ? [createLeadingButton(task, priority)] : []),
        text,
        ...doneButton,
        ...openTaskParts,
        ...createEditAndDeleteButtons(LIST.TASKS, task, text)
    );

    const { wrapper, labelLeft, labelRight } = createSwipeFrame(row, {
        left: isFocus ? 'Done' : 'Focus',
        right: 'Move to Later'
    });

    // Gestures only work on open tasks. A done task is reopened with the check button.
    if (!isDone) {
        attachSwipe(row, {
            labelLeft,
            labelRight,
            onSwipeLeft: () => (isFocus ? toggleDone(task.id, row) : pickTask(task)),
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
