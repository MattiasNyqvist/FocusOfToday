/**
 * The "Add new task" field on the Today view.
 */

import { addTask } from '../actions.js';

export function initTaskInput() {
    const input = document.getElementById('taskInput');

    const submit = () => {
        if (addTask(input.value)) {
            input.value = '';
            input.focus();
        }
    };

    document.getElementById('addTaskBtn').addEventListener('click', submit);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submit();
    });
}
