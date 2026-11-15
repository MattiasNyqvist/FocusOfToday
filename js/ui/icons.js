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
    star: [
        'M8.58737 8.23597L11.1849 3.00376C11.5183 2.33208 12.4817 2.33208 12.8151 3.00376L15.4126 8.23597L21.2215 9.08017C21.9668 9.18848 22.2638 10.0994 21.7243 10.6219L17.5217 14.6918L18.5135 20.4414C18.6409 21.1798 17.8614 21.7428 17.1945 21.3941L12 18.678L6.80547 21.3941C6.1386 21.7428 5.35909 21.1798 5.48645 20.4414L6.47825 14.6918L2.27575 10.6219C1.73617 10.0994 2.03322 9.18848 2.77852 9.08017L8.58737 8.23597Z',
    ],
    pen: [
        'M14.3632 5.65156L15.8431 4.17157C16.6242 3.39052 17.8905 3.39052 18.6716 4.17157L20.0858 5.58579C20.8668 6.36683 20.8668 7.63316 20.0858 8.41421L18.6058 9.8942M14.3632 5.65156L4.74749 15.2672C4.41542 15.5993 4.21079 16.0376 4.16947 16.5054L3.92738 19.2459C3.87261 19.8659 4.39148 20.3848 5.0115 20.33L7.75191 20.0879C8.21972 20.0466 8.65806 19.8419 8.99013 19.5099L18.6058 9.8942M14.3632 5.65156L18.6058 9.8942',
    ],
    trash: [
        'M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6M10 11v6M14 11v6',
    ],
    disk: [
        'M3 19V5C3 3.89543 3.89543 3 5 3H16.1716C16.702 3 17.2107 3.21071 17.5858 3.58579L20.4142 6.41421C20.7893 6.78929 21 7.29799 21 7.82843V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19Z',
        'M8.6 9H15.4C15.7314 9 16 8.73137 16 8.4V3.6C16 3.26863 15.7314 3 15.4 3H8.6C8.26863 3 8 3.26863 8 3.6V8.4C8 8.73137 8.26863 9 8.6 9Z',
        'M6 13.6V21H18V13.6C18 13.2686 17.7314 13 17.4 13H6.6C6.26863 13 6 13.2686 6 13.6Z',
    ],
    box: [
        'M10 12L14 12',
        'M3 3L21 3',
        'M21 7V20.4C21 20.7314 20.7314 21 20.4 21H3.6C3.26863 21 3 20.7314 3 20.4V7',
    ],
    // Lightbulb: marks the help box
    bulb: [
        'M9 18H15',
        'M10 21H14',
        'M11.9998 3C7.9997 3 5.95186 4.95029 5.99985 8C6.02324 9.48689 6.4997 10.5 7.49985 11.5C8.5 12.5 9 13 8.99985 15H14.9998C15 13.0001 15.5 12.5 16.4997 11.5001L16.4998 11.5C17.4997 10.5 17.9765 9.48689 17.9998 8C18.0478 4.95029 16 3 11.9998 3Z',
    ],
    plus: [
        'M12 5V19M5 12H19',
    ],
    arrowLeft: [
        'M19 12H5M12 19L5 12L12 5',
    ],
    // Six dots: the handle for dragging a task
    grip: [
        'M9 5H9.01M15 5H15.01M9 12H9.01M15 12H15.01M9 19H9.01M15 19H15.01',
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
    close: [
        'M6.75827 17.2426L12.0009 12M17.2435 6.75736L12.0009 12M12.0009 12L6.75827 6.75736M12.0009 12L17.2435 17.2426',
    ],
    chevronLeft: [
        'M15 6L9 12L15 18',
    ],
    chevronRight: [
        'M9 6L15 12L9 18',
    ],
};

/**
 * Build an SVG icon.
 * @param {string} name - A key in PATHS
 * @param {Object} [options]
 * @param {number} [options.size=24] - Width and height in px
 * @param {number} [options.strokeWidth=1.5] - Line thickness
 * @param {boolean} [options.filled=false] - Fill the shape (used for the active star)
 * @param {boolean} [options.inline=false] - Align with surrounding text (use inside sentences)
 * @returns {string} SVG markup
 */
export function icon(name, { size = 24, strokeWidth = 1.5, filled = false, inline = false } = {}) {
    const paths = PATHS[name];
    if (!paths) throw new Error(`Unknown icon: ${name}`);

    const fill = filled ? 'currentColor' : 'none';
    const body = paths
        .map(d => `<path d="${d}" fill="${fill}" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"></path>`)
        .join('');
    const cls = inline ? ' class="inline-icon"' : '';

    return `<svg${cls} width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${body}</svg>`;
}

/**
 * A star with a number (or check mark) inside: the priority marker of a focus task.
 * The same markup is used in the task list and in the guide texts.
 * @param {string|number} content - What to show inside the star
 * @param {Object} [options]
 * @param {number} [options.size=34] - Width and height in px
 * @param {boolean} [options.done=false] - Faded star (a finished task)
 * @param {boolean} [options.empty=false] - Dashed outline: a free place in today's focus
 * @param {boolean} [options.inline=false] - Align with surrounding text
 * @returns {string} HTML markup
 */
export function numberedStar(content, { size = 34, done = false, empty = false, inline = false } = {}) {
    const classes = ['priority-badge', done && 'priority-badge-done', empty && 'priority-badge-empty', inline && 'priority-badge-inline']
        .filter(Boolean).join(' ');
    return `<span class="${classes}" style="--star-size: ${size}px" aria-hidden="true">`
        + icon('star', { size, strokeWidth: empty ? 1.5 : 1, filled: !empty })
        + `<span class="priority-number">${content}</span></span>`;
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
