/**
 * Row menu
 * The "..." button on a task row and the small menu it opens (Move to Later, Edit, Delete).
 * Only the main action of a row is a button on the row itself; the rest is in this menu,
 * which keeps the rows calm on a small screen.
 *
 * The menu is placed on top of the page (position: fixed) so that no list can clip it.
 * Only one menu is open at a time.
 */

import { icon } from './icons.js';

/** The menu that is open now, with the button that opened it. */
let current = null;

/** Close the open menu, if any. */
export function closeRowMenu({ restoreFocus = false } = {}) {
    if (!current) return;

    const { menu, button, cleanup } = current;
    current = null;
    cleanup();
    menu.remove();
    button.setAttribute('aria-expanded', 'false');
    if (restoreFocus) button.focus();
}

/**
 * Put the menu next to its button: below it, right-aligned, or above it if there is no room.
 */
function placeMenu(menu, button) {
    const margin = 8;
    const rect = button.getBoundingClientRect();
    const { offsetWidth: width, offsetHeight: height } = menu;

    // The navigation and the quick capture bar are at the bottom of the screen
    const bottomLimit = window.innerHeight - 100;
    const fitsBelow = rect.bottom + 4 + height <= bottomLimit;
    const top = fitsBelow ? rect.bottom + 4 : Math.max(margin, rect.top - 4 - height);
    const left = Math.min(Math.max(margin, rect.right - width), window.innerWidth - width - margin);

    menu.style.top = `${top}px`;
    menu.style.left = `${left}px`;
}

/**
 * @param {Object} options
 * @param {string} options.label - Accessible name of the button
 * @param {() => Array<{label: string, iconName: string, danger?: boolean, onSelect: () => void}>} options.items
 *        Called each time the menu opens, so it always reflects the current state
 * @returns {HTMLButtonElement}
 */
export function createMenuButton({ label, items }) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'task-menu-btn';
    button.title = label;
    button.setAttribute('aria-label', label);
    button.setAttribute('aria-haspopup', 'menu');
    button.setAttribute('aria-expanded', 'false');
    button.innerHTML = icon('more', { size: 22, strokeWidth: 3 });

    button.addEventListener('click', (event) => {
        event.stopPropagation(); // do not trigger gestures on the row
        if (current?.button === button) {
            closeRowMenu({ restoreFocus: true });
        } else {
            openMenu(button, items());
        }
    });
    return button;
}

function openMenu(button, items) {
    closeRowMenu();

    const menu = document.createElement('div');
    menu.className = 'row-menu';
    menu.setAttribute('role', 'menu');

    items.forEach(item => {
        const entry = document.createElement('button');
        entry.type = 'button';
        entry.className = 'row-menu-item' + (item.danger ? ' row-menu-item-danger' : '');
        entry.setAttribute('role', 'menuitem');
        entry.dataset.action = item.action;
        entry.innerHTML = icon(item.iconName, { size: 18 }) + `<span>${item.label}</span>`;
        entry.addEventListener('click', () => {
            closeRowMenu();       // first close (the page may redraw), then act
            item.onSelect();
        });
        menu.appendChild(entry);
    });

    document.body.appendChild(menu);
    placeMenu(menu, button);
    button.setAttribute('aria-expanded', 'true');

    // Close on: a click or touch outside, Escape, scrolling, a resize
    const onOutside = (event) => {
        if (!menu.contains(event.target) && !button.contains(event.target)) closeRowMenu();
    };
    const onKey = (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            closeRowMenu({ restoreFocus: true });
        } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            const entries = [...menu.querySelectorAll('.row-menu-item')];
            const index = entries.indexOf(document.activeElement);
            const next = event.key === 'ArrowDown' ? index + 1 : index - 1;
            entries[(next + entries.length) % entries.length].focus();
        }
    };
    const onScrollOrResize = () => closeRowMenu();

    document.addEventListener('pointerdown', onOutside, true);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);

    current = {
        menu,
        button,
        cleanup: () => {
            document.removeEventListener('pointerdown', onOutside, true);
            document.removeEventListener('keydown', onKey);
            window.removeEventListener('scroll', onScrollOrResize, true);
            window.removeEventListener('resize', onScrollOrResize);
        }
    };

    menu.querySelector('.row-menu-item')?.focus();
}
