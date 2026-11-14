/**
 * Reordering tasks on the Today list
 * Two ways to do it:
 *  - Touch: swipe a task up or down (previewMove / commitMove, driven by gestures.js)
 *  - Mouse: drag and drop a task onto another one (attachDragAndDrop)
 *
 * A task can only be moved within its own list (focus or other tasks).
 * Done tasks are shown at the bottom and cannot be moved.
 */

import * as storage from '../storage.js';
import { notifyDataChanged } from '../events.js';
import { showToast } from './toast.js';

/** Minimum vertical swipe (px) before a task moves one step. */
export const VERTICAL_MOVE_THRESHOLD = 40;

const DROP_ABOVE = 'drop-zone-above';
const DROP_BELOW = 'drop-zone-below';

/** All task rows (wrappers) in the same list as `wrapper`. */
function siblingsOf(wrapper) {
    return Array.from(wrapper.parentElement.querySelectorAll('.task-item-wrapper'));
}

/** The row `wrapper` would swap with for a vertical swipe of `diffY`, or null. */
function neighborFor(wrapper, diffY) {
    const rows = siblingsOf(wrapper);
    const index = rows.indexOf(wrapper);
    if (index === -1) return null;

    if (diffY < -VERTICAL_MOVE_THRESHOLD && index > 0) return rows[index - 1];
    if (diffY > VERTICAL_MOVE_THRESHOLD && index < rows.length - 1) return rows[index + 1];
    return null;
}

/** Remove the drop-zone highlight from all rows. */
export function clearPreview() {
    document.querySelectorAll(`.${DROP_ABOVE}, .${DROP_BELOW}`).forEach(el => {
        el.classList.remove(DROP_ABOVE, DROP_BELOW);
    });
}

/** Highlight the row that the swiped task would swap with. */
export function previewMove(wrapper, diffY) {
    clearPreview();
    const neighbor = neighborFor(wrapper, diffY);
    if (neighbor) neighbor.classList.add(diffY < 0 ? DROP_ABOVE : DROP_BELOW);
}

/**
 * Move a swiped task one step up or down.
 * @returns {boolean} true if the order changed
 */
export function commitMove(task, wrapper, diffY) {
    const neighbor = neighborFor(wrapper, diffY);
    const neighborItem = neighbor?.querySelector('.task-item');
    if (!neighborItem || neighborItem.classList.contains('task-done-state')) return false;

    return moveBefore(task.id, Number(neighborItem.dataset.taskId));
}

/** Put task `id` at the position of task `targetId` in the stored list. */
function moveBefore(id, targetId) {
    const tasks = storage.loadTasks();
    const from = tasks.findIndex(t => t.id === id);
    const to = tasks.findIndex(t => t.id === targetId);
    if (from === -1 || to === -1 || from === to) return false;
    if (tasks[from].starred !== tasks[to].starred) return false; // different list

    const [moved] = tasks.splice(from, 1);
    tasks.splice(to, 0, moved);
    storage.saveTasks(tasks);
    notifyDataChanged();
    showToast('✓ Order updated');
    return true;
}

// ---- Mouse drag and drop ----

let draggedTask = null;

/**
 * Make a task row draggable with the mouse.
 * @param {HTMLElement} element - The .task-item
 * @param {Object} task
 */
export function attachDragAndDrop(element, task) {
    const isSameList = () => {
        const current = storage.loadTasks().find(t => t.id === task.id);
        return draggedTask && current && draggedTask.starred === current.starred;
    };

    element.addEventListener('dragstart', (e) => {
        draggedTask = task;
        element.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    });

    element.addEventListener('dragend', () => {
        element.classList.remove('dragging');
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        draggedTask = null;
    });

    element.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedTask && draggedTask.id !== task.id && isSameList()) {
            element.classList.add('drag-over');
        }
    });

    element.addEventListener('dragleave', () => element.classList.remove('drag-over'));

    element.addEventListener('drop', (e) => {
        e.preventDefault();
        element.classList.remove('drag-over');
        if (draggedTask && draggedTask.id !== task.id) {
            moveBefore(draggedTask.id, task.id);
        }
    });
}
