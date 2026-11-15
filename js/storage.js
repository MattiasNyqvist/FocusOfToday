/**
 * Storage layer
 * Everything that reads or writes localStorage lives here.
 * The rest of the app never touches localStorage for task data.
 *
 * A task looks like this (the same shape is used in all three lists):
 * {
 *   id: number,                  // Date.now() when created
 *   text: string,
 *   starred: boolean,            // true = part of today's focus
 *   status: 'active' | 'done',   // done tasks stay on the Today list until the next day
 *   createdAt: ISO string,
 *   completedAt: ISO string | null,
 *   movedToBacklogAt?: ISO string,   // backlog only
 *   archivedAt?: ISO string          // archive only
 * }
 */

import { CONFIG, STORAGE_KEYS, FOCUS_LIMIT_MIN, FOCUS_LIMIT_MAX, MAX_TASK_LENGTH } from './config.js';

/** The three task lists. */
export const LIST = Object.freeze({
    TASKS: 'tasks',
    BACKLOG: 'backlog',
    ARCHIVE: 'archive'
});

// ============================================
// Low-level helpers
// ============================================

/** Read a plain string preference. Returns null if missing or storage is unavailable. */
export function readPref(key) {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

/** Write a plain string preference. Failures (private mode, full storage) are ignored. */
export function writePref(key, value) {
    try {
        localStorage.setItem(key, String(value));
    } catch {
        // Not critical: the preference is simply not remembered.
    }
}

/** Load a task list. Always returns an array. */
export function loadList(list) {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS[list]));
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error(`Could not load ${list}:`, error);
        return [];
    }
}

/** Save a task list. Returns true on success. */
export function saveList(list, items) {
    try {
        localStorage.setItem(STORAGE_KEYS[list], JSON.stringify(items));
        return true;
    } catch (error) {
        console.error(`Could not save ${list}:`, error);
        return false;
    }
}

export const loadTasks = () => loadList(LIST.TASKS);
export const saveTasks = (items) => saveList(LIST.TASKS, items);
export const loadBacklog = () => loadList(LIST.BACKLOG);
export const loadArchive = () => loadList(LIST.ARCHIVE);

// ============================================
// Operations that work on any list
// ============================================

/** Find a task by id in a list. */
export function findItem(list, id) {
    return loadList(list).find(item => item.id === id) ?? null;
}

/** Merge `updates` into a task. Returns the updated task or null. */
export function updateItem(list, id, updates) {
    const items = loadList(list);
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;

    items[index] = { ...items[index], ...updates };
    saveList(list, items);
    return items[index];
}

/** Remove a task from a list. */
export function deleteItem(list, id) {
    saveList(list, loadList(list).filter(item => item.id !== id));
}

/** Put a task back at the end of a list (used by undo). */
export function restoreItem(list, item) {
    const items = loadList(list);
    items.push(item);
    saveList(list, items);
}

/**
 * Move a task from one list to another.
 * @param {string} from - Source list
 * @param {string} to - Target list
 * @param {number} id - Task id
 * @param {(task: Object) => Object} transform - Returns the task as it should look in the target list
 * @returns {boolean} false if the task was not found
 */
function moveItem(from, to, id, transform) {
    const source = loadList(from);
    const index = source.findIndex(item => item.id === id);
    if (index === -1) return false;

    const [task] = source.splice(index, 1);
    const target = loadList(to);
    target.push(transform(task));

    saveList(to, target);
    saveList(from, source);
    return true;
}

// ============================================
// Today
// ============================================

/** Add a new task to the end of Today. */
export function addTask(text) {
    const tasks = loadTasks();
    const task = {
        id: Date.now(),
        text: text.trim().slice(0, MAX_TASK_LENGTH),
        starred: false,
        status: 'active',
        createdAt: new Date().toISOString(),
        completedAt: null
    };
    tasks.push(task);
    saveTasks(tasks);
    return task;
}

/** Number of tasks in today's focus. Done tasks count: the limit is per day. */
export function countFocusTasks() {
    return loadTasks().filter(task => task.starred).length;
}

/** True if another task may be added to today's focus. */
export function canAddFocusTask() {
    return countFocusTasks() < CONFIG.maxFocusTasks;
}

/**
 * Move all done tasks to the archive. They stay on the Today list until the next day.
 * @returns {number} How many tasks were archived
 */
export function archiveFinishedTasks() {
    const tasks = loadTasks();
    const finished = tasks.filter(task => task.status === 'done');
    if (finished.length === 0) return 0;

    const archive = loadArchive();
    finished.forEach(task => {
        archive.push({ ...task, archivedAt: task.completedAt || new Date().toISOString() });
    });
    saveList(LIST.ARCHIVE, archive);
    saveTasks(tasks.filter(task => task.status !== 'done'));
    return finished.length;
}

// ============================================
// Moving between lists
// ============================================

/** Today -> Backlog */
export function moveToBacklog(id) {
    return moveItem(LIST.TASKS, LIST.BACKLOG, id, task => ({
        ...task,
        starred: false,
        status: 'active',
        completedAt: null,
        movedToBacklogAt: new Date().toISOString()
    }));
}

/** A task that returns to Today starts fresh: open and not in focus. */
function reopen({ movedToBacklogAt, archivedAt, ...task }) {
    return { ...task, starred: false, status: 'active', completedAt: null };
}

/** Backlog -> Today */
export function moveFromBacklogToToday(id) {
    return moveItem(LIST.BACKLOG, LIST.TASKS, id, reopen);
}

/** Archive -> Today */
export function moveFromArchiveToToday(id) {
    return moveItem(LIST.ARCHIVE, LIST.TASKS, id, reopen);
}

// ============================================
// Export and import
// ============================================

/** All app data, ready to be saved as a JSON backup. */
export function exportData() {
    return {
        version: 1,
        exportedAt: new Date().toISOString(),
        tasks: loadTasks(),
        backlog: loadBacklog(),
        archive: loadArchive(),
        settings: { maxFocusTasks: CONFIG.maxFocusTasks }
    };
}

/**
 * A backup may hold longer texts than the field allows (from an older version), so it is
 * checked against a generous limit instead of MAX_TASK_LENGTH. Backups larger than
 * MAX_BACKUP_BYTES are refused (a real backup is a few kilobytes).
 */
const MAX_IMPORTED_TEXT = 500;
const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

/**
 * Check that a value looks like a task and return a clean copy, or null if it does not.
 * Unknown fields are dropped so a hand-edited file cannot add anything odd.
 */
function cleanTask(value) {
    if (!value || typeof value !== 'object') return null;
    if (!Number.isFinite(value.id) || typeof value.text !== 'string' || !value.text.trim()) return null;

    const task = {
        id: value.id,
        text: value.text.trim().slice(0, MAX_IMPORTED_TEXT),
        starred: value.starred === true,
        status: value.status === 'done' ? 'done' : 'active',
        createdAt: typeof value.createdAt === 'string' ? value.createdAt : new Date().toISOString(),
        completedAt: typeof value.completedAt === 'string' ? value.completedAt : null
    };
    if (typeof value.movedToBacklogAt === 'string') task.movedToBacklogAt = value.movedToBacklogAt;
    if (typeof value.archivedAt === 'string') task.archivedAt = value.archivedAt;
    return task;
}

/** Clean a whole list. A missing list becomes empty; a list of the wrong kind is an error. */
function cleanList(value, name) {
    if (value === undefined) return [];
    if (!Array.isArray(value)) throw new Error(`"${name}" is not a list.`);

    const tasks = value.map(cleanTask);
    if (tasks.includes(null)) throw new Error(`"${name}" contains an item that is not a valid task.`);
    return tasks;
}

/**
 * Read a backup file made by exportData().
 * Nothing is saved here: the result is only what the file contains, checked and cleaned.
 * @param {string} text - The file's content
 * @returns {{tasks: Object[], backlog: Object[], archive: Object[], maxFocusTasks: number|null}}
 * @throws {Error} With a message that can be shown to the user
 */
export function parseBackup(text) {
    if (text.length > MAX_BACKUP_BYTES) throw new Error('The file is too large to be a backup.');

    let data;
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error('The file is not valid JSON.');
    }
    if (!data || typeof data !== 'object' || Array.isArray(data) || !Array.isArray(data.tasks)) {
        throw new Error('The file is not a Focus of Today backup.');
    }

    const limit = data.settings?.maxFocusTasks;
    return {
        tasks: cleanList(data.tasks, 'tasks'),
        backlog: cleanList(data.backlog, 'backlog'),
        archive: cleanList(data.archive, 'archive'),
        maxFocusTasks: Number.isInteger(limit) && limit >= FOCUS_LIMIT_MIN && limit <= FOCUS_LIMIT_MAX ? limit : null
    };
}

/**
 * Replace all task data with a backup from parseBackup().
 * @returns {boolean} false if something could not be saved
 */
export function importData({ tasks, backlog, archive }) {
    return saveList(LIST.TASKS, tasks) && saveList(LIST.BACKLOG, backlog) && saveList(LIST.ARCHIVE, archive);
}
