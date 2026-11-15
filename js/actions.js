/**
 * Actions
 * Everything the user can do with a task. Each action changes the stored data,
 * tells the user what happened, and announces the change (see events.js).
 * Nothing in here builds or touches the task list in the DOM.
 */

import { CONFIG, MAX_TASK_LENGTH } from './config.js';
import * as storage from './storage.js';
import { LIST } from './storage.js';
import { notifyDataChanged } from './events.js';
import { showToast, showToastWithUndo } from './ui/toast.js';
import { showCelebration } from './ui/celebration.js';

/**
 * Add a task to Today.
 * @param {string} text
 * @returns {boolean} false if the text was empty
 */
export function addTask(text) {
    if (!text.trim()) return false;
    storage.addTask(text);
    notifyDataChanged();
    return true;
}

/** Change the text of a task in any list. */
export function editTaskText(list, id, text) {
    const trimmed = text.trim().slice(0, MAX_TASK_LENGTH);
    if (!trimmed) return;
    storage.updateItem(list, id, { text: trimmed });
    notifyDataChanged();
}

/** Delete a task from any list. The toast offers UNDO. */
export function deleteTask(list, id) {
    const task = storage.findItem(list, id);
    if (!task) return;

    storage.deleteItem(list, id);
    notifyDataChanged();

    showToastWithUndo('Task deleted', () => {
        storage.restoreItem(list, task);
        notifyDataChanged();
        showToast('✓ Task restored');
    });
}

/**
 * Add a task to, or remove it from, today's focus.
 * New focus tasks go after the existing ones (they get the next priority number).
 * Removed ones go to the top of the other tasks.
 */
export function toggleFocus(id) {
    const tasks = storage.loadTasks();
    const index = tasks.findIndex(task => task.id === id);
    if (index === -1) return;

    const task = tasks[index];
    const addingToFocus = !task.starred;

    if (addingToFocus && !storage.canAddFocusTask()) {
        showToast(`Focus is full (max ${CONFIG.maxFocusTasks} tasks)`);
        return;
    }

    task.starred = addingToFocus;
    tasks.splice(index, 1);

    if (addingToFocus) {
        const lastFocusIndex = tasks.findLastIndex(t => t.starred);
        tasks.splice(lastFocusIndex + 1, 0, task);
    } else {
        const firstOtherIndex = tasks.findIndex(t => !t.starred);
        if (firstOtherIndex === -1) {
            tasks.push(task);
        } else {
            tasks.splice(firstOtherIndex, 0, task);
        }
    }

    storage.saveTasks(tasks);
    notifyDataChanged();
    showToast(addingToFocus ? '⭐ Added to Today\'s Focus' : '📋 Moved to Tasks');
}

/**
 * Mark a task as done, or as not done again.
 * A done task stays on the Today list for the rest of the day and is archived tomorrow.
 * @param {number} id
 * @param {HTMLElement} [element] - The task row, used as the origin of the confetti
 */
export function toggleDone(id, element) {
    const task = storage.findItem(LIST.TASKS, id);
    if (!task) return;

    if (task.status === 'done') {
        storage.updateItem(LIST.TASKS, id, { status: 'active', completedAt: null });
        notifyDataChanged();
        showToast('↩ Marked as not done');
        return;
    }

    storage.updateItem(LIST.TASKS, id, { status: 'done', completedAt: new Date().toISOString() });
    if (element) showCelebration(element);
    notifyDataChanged();

    const focusTasks = storage.loadTasks().filter(t => t.starred);
    const doneInFocus = focusTasks.filter(t => t.status === 'done').length;
    if (task.starred && doneInFocus === focusTasks.length) {
        showToast(`🎉 ${doneInFocus}/${focusTasks.length} - all focus tasks done!`);
    } else {
        showToast('✓ Task done');
    }
}

/** Today -> Backlog */
export function sendToBacklog(id) {
    if (storage.moveToBacklog(id)) {
        notifyDataChanged();
        showToast('📦 Moved to backlog');
    }
}

/** Backlog or Archive -> Today */
export function returnToToday(list, id) {
    const moved = list === LIST.BACKLOG
        ? storage.moveFromBacklogToToday(id)
        : storage.moveFromArchiveToToday(id);

    if (moved) {
        notifyDataChanged();
        showToast('✓ Moved to today');
    }
}

/**
 * Keep or move the focus tasks that were still open from an earlier day.
 * @param {number[]} idsToBacklog - Tasks to move to the backlog; all others stay in focus
 */
export function moveToBacklogMany(idsToBacklog) {
    idsToBacklog.forEach(id => storage.moveToBacklog(id));
    if (idsToBacklog.length > 0) {
        notifyDataChanged();
        const n = idsToBacklog.length;
        showToast(`📦 ${n} task${n === 1 ? '' : 's'} moved to backlog`);
    }
}
