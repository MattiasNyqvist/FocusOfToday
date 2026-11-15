/**
 * Icons
 * The single source for every SVG icon that is used more than once.
 *
 * - In JavaScript:  icon('trash', { size: 20 })
 * - In index.html:  <span data-icon="trash" data-size="18"></span>
 *   (filled in by mountIcons() when the app starts)
 *
 * All icons are 24x24 line icons that inherit their color from CSS (currentColor).
 */

const PATHS = {
    pen: [
        'M14.3632 5.65156L15.8431 4.17157C16.6242 3.39052 17.8905 3.39052 18.6716 4.17157L20.0858 5.58579C20.8668 6.36683 20.8668 7.63316 20.0858 8.41421L18.6058 9.8942M14.3632 5.65156L4.74749 15.2672C4.41542 15.5993 4.21079 16.0376 4.16947 16.5054L3.92738 19.2459C3.87261 19.8659 4.39148 20.3848 5.0115 20.33L7.75191 20.0879C8.21972 20.0466 8.65806 19.8419 8.99013 19.5099L18.6058 9.8942M14.3632 5.65156L18.6058 9.8942',
    ],
    trash: [
        'M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6M10 11v6M14 11v6',
    ],
    box: [
        'M10 12L14 12',
        'M3 3L21 3',
        'M21 7V20.4C21 20.7314 20.7314 21 20.4 21H3.6C3.26863 21 3 20.7314 3 20.4V7',
    ],
    // Three dots in a row: opens the menu of a task
    more: [
        'M5 12H5.01M12 12H12.01M19 12H19.01',
    ],
    help: [
        'M12 21A9 9 0 1 0 12 3A9 9 0 0 0 12 21Z',
        'M9.5 9.5A2.5 2.5 0 1 1 13 11.8C12.3 12.2 12 12.7 12 13.5',
        'M12 17H12.01',
    ],
    plus: [
        'M12 5V19M5 12H19',
    ],
    arrowLeft: [
        'M19 12H5M12 19L5 12L12 5',
    ],
    // Six dots: the handle for dragging a task
    grip: [
        'M8 5H8.01M16 5H16.01M8 12H8.01M16 12H16.01M8 19H8.01M16 19H16.01',
    ],
    download: [
        'M6 20L18 20',
        'M12 4V16M12 16L15.5 12.5M12 16L8.5 12.5',
    ],
    upload: [
        'M6 20L18 20',
        'M12 16V4M12 4L15.5 7.5M12 4L8.5 7.5',
    ],
    // App logo: a triangle pointing up and to the right, divided into six smaller triangles
    logo: [
        'M21.80 2.20L2.20 6.93L17.07 21.80Z',
        'M21.80 2.20L9.63 14.37M2.20 6.93L19.43 12.00M17.07 21.80L12.00 4.57',
    ],
    check: [
        'M5 13L9 17L19 7',
    ],
};

/**
 * Build an SVG icon.
 * @param {string} name - A key in PATHS
 * @param {Object} [options]
 * @param {number} [options.size=24] - Width and height in px
 * @param {number} [options.strokeWidth=1.5] - Line thickness
 * @param {boolean} [options.inline=false] - Align with surrounding text (use inside sentences)
 * @returns {string} SVG markup
 */
export function icon(name, { size = 24, strokeWidth = 1.5, inline = false } = {}) {
    const paths = PATHS[name];
    if (!paths) throw new Error(`Unknown icon: ${name}`);

    const body = paths
        .map(d => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"></path>`)
        .join('');
    const cls = inline ? ' class="inline-icon"' : '';

    return `<svg${cls} width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${body}</svg>`;
}

/**
 * A filled circle with a number (or check mark) inside: the rank of a task in today's focus.
 * Used for the numbers in today's focus and for the free places.
 * @param {string|number} content - What to show inside the circle
 * @param {Object} [options]
 * @param {number} [options.size=28] - Width and height in px
 * @param {boolean} [options.done=false] - Faded circle (a finished task)
 * @param {boolean} [options.empty=false] - Dashed outline: a free place in today's focus
 * @returns {string} HTML markup
 */
export function numberedCircle(content, { size = 28, done = false, empty = false } = {}) {
    const classes = ['priority-badge', done && 'priority-badge-done', empty && 'priority-badge-empty']
        .filter(Boolean).join(' ');
    return `<span class="${classes}" style="--badge-size: ${size}px" aria-hidden="true">${content}</span>`;
}

/**
 * Replace every <span data-icon="name"> in the document with its SVG.
 * Optional attributes: data-size (px), data-stroke (line thickness).
 * @param {ParentNode} [root=document]
 */
export function mountIcons(root = document) {
    root.querySelectorAll('[data-icon]').forEach(el => {
        el.innerHTML = icon(el.dataset.icon, {
            size: Number(el.dataset.size) || 24,
            strokeWidth: Number(el.dataset.stroke) || 1.5
        });
    });
}
