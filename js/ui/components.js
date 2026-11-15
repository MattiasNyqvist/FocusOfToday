/**
 * Components
 * Some pieces of markup are used in several views: the header and the assistant box.
 * They are written once as <template> elements in index.html. Wherever a view has
 *     <div data-component="header" data-subtitle="Backlog"></div>
 *     <div data-component="assistant"></div>
 * this module puts a copy of the matching template in its place.
 */

import { mountIcons } from './icons.js';

/** Fill in all component placeholders and icons. Call once, before anything else uses the DOM. */
export function mountComponents() {
    document.querySelectorAll('[data-component]').forEach(placeholder => {
        const template = document.getElementById(`${placeholder.dataset.component}Template`);
        const copy = template.content.cloneNode(true);

        const subtitle = copy.querySelector('.header-subtitle');
        if (subtitle) subtitle.textContent = placeholder.dataset.subtitle ?? '';

        placeholder.replaceWith(copy);
    });

    mountIcons();
}
