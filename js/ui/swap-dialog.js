/**
 * Swap dialog
 * Shown when the user picks a task but today's focus is already full. Instead of an error,
 * the user makes the choice the method is about: which task gives way?
 */

import { CONFIG } from '../config.js';
import { loadTasks } from '../storage.js';
import { swapFocus } from '../actions.js';
import { showToast } from './toast.js';

/**
 * Ask which focus task should make room for `task`.
 * @param {{id: number, text: string}} task - The task that was picked
 */
export function openSwapDialog(task) {
    // Finished tasks stay: only a task that is still open can give its place away.
    const openFocus = loadTasks().filter(t => t.starred && t.status !== 'done');
    if (openFocus.length === 0) {
        showToast(`All ${CONFIG.maxFocusTasks} focus tasks are done. Well done!`);
        return;
    }

    const dialog = document.getElementById('swapDialog');
    document.getElementById('swapText').textContent =
        `Today's focus holds ${CONFIG.maxFocusTasks} tasks. Which one gives way to "${task.text}"?`;

    const list = document.getElementById('swapList');
    list.replaceChildren(...openFocus.map((focusTask, index) => {
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'swap-option';

        const number = document.createElement('span');
        number.className = 'swap-option-number';
        number.textContent = String(index + 1);
        const text = document.createElement('span');
        text.textContent = focusTask.text;
        button.append(number, text);

        button.addEventListener('click', () => {
            dialog.close();
            swapFocus(focusTask.id, task.id);
        });
        item.appendChild(button);
        return item;
    }));

    document.getElementById('swapCancel').onclick = () => dialog.close();
    dialog.showModal();
}
