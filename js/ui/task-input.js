/**
 * The quick capture field at the bottom of the Today view.
 */

import { MAX_TASK_LENGTH } from '../config.js';
import { addTask } from '../actions.js';

export function initTaskInput() {
    const input = document.getElementById('taskInput');
    const count = document.getElementById('taskInputCount');
    const hint = document.getElementById('composerHint');
    input.maxLength = MAX_TASK_LENGTH;

    /**
     * While the field is idle the bar shows a hint about what to do next; while it is in use
     * the hint gives way to "5 of 120".
     */
    const updateCount = () => {
        const length = input.value.length;
        count.textContent = `${length} of ${MAX_TASK_LENGTH}`;
        count.classList.toggle('input-count-full', length >= MAX_TASK_LENGTH);
        const inUse = document.activeElement === input || length > 0;
        count.classList.toggle('input-count-visible', inUse);
        hint.classList.toggle('composer-hint-hidden', inUse); // the hint makes room for the count
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
    input.addEventListener('focus', updateCount);
    input.addEventListener('blur', updateCount);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submit();
    });
}
