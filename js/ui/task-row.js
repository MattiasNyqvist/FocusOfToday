/**
 * Task row building blocks
 * Pieces shared by the Today, Later and Done lists: icon buttons, the "..." menu,
 * the swipe frame around a row, and inline editing of a task's text.
 */

import { icon } from './icons.js';
import { MAX_TASK_LENGTH } from '../config.js';
import { editTaskText, deleteTask } from '../actions.js';
import { createMenuButton } from './row-menu.js';

/**
 * A round icon button inside a task row.
 * @param {Object} options
 * @param {string} options.className - e.g. 'task-edit'
 * @param {string} options.label - Tooltip and accessible name
 * @param {string} options.iconName - Key in icons.js
 * @param {number} [options.size=20]
 * @param {() => void} options.onClick
 */
export function createIconButton({ className, label, iconName, size = 20, onClick }) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.title = label;
    button.setAttribute('aria-label', label);
    button.innerHTML = icon(iconName, { size });
    button.addEventListener('click', (e) => {
        e.stopPropagation(); // do not trigger gestures on the row
        onClick();
    });
    return button;
}

/** The task text element. */
export function createTextElement(task) {
    const text = document.createElement('div');
    text.className = 'task-text';
    text.textContent = task.text;
    return text;
}

/**
 * The "..." button of a row. Its menu holds the less common actions: any `extraItems`
 * (for example "Move to Later"), then Edit and Delete.
 * @param {string} list - The list the task is in
 * @param {Object} task
 * @param {HTMLElement} textElement - The task text, replaced by an input while editing
 * @param {Array} [extraItems] - Menu items for this kind of row, shown first
 */
export function createRowMenu(list, task, textElement, extraItems = []) {
    return createMenuButton({
        label: 'More actions',
        items: () => [
            ...extraItems,
            { action: 'edit', label: 'Edit', iconName: 'pen', onSelect: () => startInlineEdit(list, task, textElement) },
            { action: 'delete', label: 'Delete', iconName: 'trash', danger: true, onSelect: () => deleteTask(list, task.id) }
        ]
    });
}

/**
 * Wrap a row in a frame with labels behind it. The labels show while the row is swiped.
 * @param {HTMLElement} row - The .task-item
 * @param {{left?: string, right?: string}} labels - Text for each swipe direction
 * @returns {{wrapper: HTMLElement, labelLeft?: HTMLElement, labelRight?: HTMLElement}}
 */
export function createSwipeFrame(row, labels) {
    const createLabel = (side, text) => {
        const label = document.createElement('div');
        label.className = `swipe-background ${side}`;
        label.style.display = 'none';
        const span = document.createElement('span');
        span.className = 'swipe-background-text';
        span.textContent = text;
        label.appendChild(span);
        return label;
    };

    const wrapper = document.createElement('div');
    wrapper.className = 'task-item-wrapper';

    const labelLeft = labels.left ? createLabel('left', labels.left) : undefined;
    const labelRight = labels.right ? createLabel('right', labels.right) : undefined;
    wrapper.append(...[labelLeft, labelRight, row].filter(Boolean));

    return { wrapper, labelLeft, labelRight };
}

/**
 * Edit a task's text in place.
 * Enter or clicking away saves, Escape cancels.
 */
function startInlineEdit(list, task, textElement) {
    const originalText = task.text;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-edit-input';
    input.value = originalText;
    input.maxLength = MAX_TASK_LENGTH;
    input.setAttribute('aria-label', 'Task text');

    textElement.style.display = 'none';
    textElement.before(input);
    input.focus();
    input.select();

    let finished = false;
    const finish = (save) => {
        if (finished) return; // Enter/Escape and the blur that follows must only count once
        finished = true;

        input.remove();
        textElement.style.display = '';

        const newText = input.value.trim();
        if (save && newText && newText !== originalText) {
            editTaskText(list, task.id, newText); // redraws the list
        }
    };

    input.addEventListener('blur', () => finish(true));
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            finish(true);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            finish(false);
        }
    });
}
