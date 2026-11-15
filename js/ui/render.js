/**
 * Redraws the lists. The lists are small, so redrawing everything after a change
 * is simpler and fast enough.
 */

import { renderTasks } from './task-list.js';
import { renderBacklog, renderArchive } from './simple-lists.js';
import { closeRowMenu } from './row-menu.js';

export function renderAll() {
    closeRowMenu(); // a menu that belongs to a row about to be redrawn must not stay open
    renderTasks();
    renderBacklog();
    renderArchive();
}
