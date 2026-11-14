/**
 * Redraws the lists. The lists are small, so redrawing everything after a change
 * is simpler and fast enough.
 */

import { renderTasks } from './task-list.js';
import { renderBacklog, renderArchive } from './simple-lists.js';

export function renderAll() {
    renderTasks();
    renderBacklog();
    renderArchive();
}
