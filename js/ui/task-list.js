/**
 * Today view
 * Draws today's focus (a fixed number of places) and the brain dump below it.
 *
 * Focus tasks are numbered 1..n: number 1 is done first. Places that are still free are
 * drawn as empty numbered slots, so the daily limit is visible before it is reached.
 * Tasks in the brain dump are waiting to be picked.
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

/** Redraw the focus list, the brain dump and the counter next to the focus heading. */
export function renderTasks() {
    const tasks = loadTasks();

    // Sort is stable: open tasks first, done tasks last, stored order kept inside each group
    const openFirst = (a, b) => Number(a.status === 'done') - Number(b.status === 'done');
    const focusTasks = tasks.filter(t => t.starred).sort(openFirst);
    const brainDump = tasks.filter(t => !t.starred).sort(openFirst);

    renderFocusList(focusTasks);
    renderBrainDump(brainDump);
    updateFocusCounter(focusTasks.filter(t => t.status === 'done').length, focusTasks.length);
    updateFocusPrompt(focusTasks.length, brainDump.length);
}

/** "Done / chosen (max N)", for example "1/5 (max 6)". Before anything is chosen: "(max 6)". */
function updateFocusCounter(doneCount, chosenCount) {
    const counter = document.getElementById('focusCounter');
    const max = document.createElement('span');
    max.textContent = chosenCount > 0 ? ` (max ${CONFIG.maxFocusTasks})` : `(max ${CONFIG.maxFocusTasks})`;
    counter.replaceChildren(...(chosenCount > 0 ? [`${doneCount}/${chosenCount}`] : []), max);
}

/** The question under the heading. It is only there until the first task is picked. */
function updateFocusPrompt(chosenCount, brainDumpCount) {
    const prompt = document.getElementById('focusPrompt');
    prompt.hidden = chosenCount > 0;
    prompt.textContent = brainDumpCount === 0
        ? `What matters most today? Write your tasks in the brain dump below, then pick up to ${CONFIG.maxFocusTasks}.`
        : `What matters most today? Pick up to ${CONFIG.maxFocusTasks} tasks from your brain dump.`;
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

function renderBrainDump(tasks) {
    const container = document.getElementById('allTasksList');
    container.replaceChildren();

    if (tasks.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.textContent = 'Nothing here yet. Write down anything that comes to mind.';
        container.appendChild(empty);
        return;
    }

    tasks.forEach(task => container.appendChild(createTaskRow(task, null)));
}

/** Scroll to the brain dump, and start typing there if it is empty. */
function goToBrainDump() {
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
    slot.setAttribute('aria-label', `Free place ${number} in today's focus. Pick a task from your brain dump.`);
    slot.innerHTML = numberedStar(number, { empty: true }) + '<span class="focus-slot-text">Pick a task</span>';
    slot.addEventListener('click', goToBrainDump);
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

/** "Pick": puts a brain dump task in today's focus. */
function createPickButton(task) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'task-pick';
    button.title = "Add to today's focus";
    button.setAttribute('aria-label', `Add "${task.text}" to today's focus`);
    button.innerHTML = icon('star', { size: 14, strokeWidth: 2 }) + '<span>Pick</span>';
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
    grip.innerHTML = icon('grip', { size: 12, strokeWidth: 3.5 });
    return grip;
}

/**
 * One row. `priority` is the task's number in today's focus, or null for a brain dump task.
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

    // Only focus tasks are worked on, so only they get a check button. A brain dump task that is
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
        left: isFocus ? 'Done' : 'Pick',
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
