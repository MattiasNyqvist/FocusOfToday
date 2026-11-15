/**
 * The "Add new task" field on the Today view.
 */

import { MAX_TASK_LENGTH } from '../config.js';
import { addTask } from '../actions.js';

export function initTaskInput() {
    const input = document.getElementById('taskInput');
    const count = document.getElementById('taskInputCount');
    input.maxLength = MAX_TASK_LENGTH;

    /** "5 of 120", always visible so the limit is known before it is reached. */
    const updateCount = () => {
        const length = input.value.length;
        count.textContent = `${length} of ${MAX_TASK_LENGTH}`;
        count.classList.toggle('input-count-full', length >= MAX_TASK_LENGTH);
    };

    const submit = () => {
        if (addTask(input.value)) {
            input.value = '';
            updateCount();
            input.focus();
        }
    };

    updateCount();

    document.getElementById('addTaskBtn').addEventListener('click', submit);
    input.addEventListener('input', updateCount);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submit();
    });
}
