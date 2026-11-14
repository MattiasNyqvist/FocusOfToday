/**
 * Swipe gestures
 * Lets the user swipe a task row left or right (and optionally up/down).
 * This module only handles the finger movement and the visual feedback;
 * what a swipe *does* is decided by the callbacks the caller passes in.
 */

/** Horizontal distance (px) a swipe must travel to count. */
const SWIPE_DISTANCE = 100;
/** Distance (px) before the direction (horizontal/vertical) is decided. */
const DIRECTION_THRESHOLD = 10;
/** Distance (px) before the label behind the row is shown. */
const LABEL_THRESHOLD = 30;
/** Time (ms) of the slide-out and snap-back animations. Keep in sync with the CSS. */
const ANIMATION_MS = 300;

const SNAP_BACK_TRANSITION = `transform ${ANIMATION_MS}ms ease, opacity ${ANIMATION_MS}ms ease, box-shadow ${ANIMATION_MS}ms ease`;

/** Clear the inline styles a swipe puts on a row. */
function resetRowStyle(element, transition = SNAP_BACK_TRANSITION) {
    element.style.transition = transition;
    element.style.transform = '';
    element.style.opacity = '';
    element.style.boxShadow = '';
    element.style.zIndex = '';
}

/**
 * Slide a row out of the screen, then run `then`.
 * @param {HTMLElement} element
 * @param {'left'|'right'} direction
 * @param {() => void} then
 */
export function slideOut(element, direction, then) {
    element.style.transition = `transform ${ANIMATION_MS}ms ease, opacity ${ANIMATION_MS}ms ease`;
    element.style.transform = `translateX(${direction === 'left' ? '-100%' : '100%'})`;
    element.style.opacity = '0';
    setTimeout(then, ANIMATION_MS);
}

/**
 * Make a row swipeable.
 *
 * @param {HTMLElement} element - The .task-item that moves with the finger
 * @param {Object} options
 * @param {HTMLElement} [options.labelLeft] - Shown behind the row while swiping left
 * @param {HTMLElement} [options.labelRight] - Shown behind the row while swiping right
 * @param {(element: HTMLElement) => void} [options.onSwipeLeft] - Omit to disable left swipes
 * @param {(element: HTMLElement) => void} [options.onSwipeRight] - Omit to disable right swipes
 * @param {{preview: (diffY: number) => void, commit: (diffY: number) => boolean, clear: () => void, threshold: number}} [options.vertical]
 *        Up/down swipes. preview() runs while moving; commit() runs when the finger is released
 *        and returns true if it changed something; clear() removes the preview.
 */
export function attachSwipe(element, { labelLeft, labelRight, onSwipeLeft, onSwipeRight, vertical }) {
    let tracking = false;
    let startX = 0;
    let startY = 0;
    let diffX = 0;
    let diffY = 0;
    let direction = null; // 'horizontal' | 'vertical'

    const showLabels = (side) => {
        if (labelLeft) labelLeft.style.display = side === 'left' ? 'flex' : 'none';
        if (labelRight) labelRight.style.display = side === 'right' ? 'flex' : 'none';
    };

    const reset = () => {
        tracking = false;
        diffX = 0;
        diffY = 0;
        direction = null;
    };

    element.addEventListener('touchstart', (e) => {
        tracking = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        diffX = 0;
        diffY = 0;
        direction = null;
        element.style.transition = 'none';
        showLabels(null);
    }, { passive: true });

    element.addEventListener('touchmove', (e) => {
        if (!tracking) return;

        diffX = e.touches[0].clientX - startX;
        diffY = e.touches[0].clientY - startY;

        if (!direction && (Math.abs(diffX) > DIRECTION_THRESHOLD || Math.abs(diffY) > DIRECTION_THRESHOLD)) {
            direction = Math.abs(diffX) > Math.abs(diffY) ? 'horizontal' : 'vertical';
        }

        if (direction === 'horizontal') {
            const allowed = diffX < 0 ? onSwipeLeft : onSwipeRight;
            if (!allowed || Math.abs(diffX) <= DIRECTION_THRESHOLD) return;

            e.preventDefault(); // stop the page from scrolling sideways
            element.style.transform = `translateX(${diffX}px)`;
            if (diffX < -LABEL_THRESHOLD) showLabels('left');
            else if (diffX > LABEL_THRESHOLD) showLabels('right');
            else showLabels(null);
        } else if (direction === 'vertical' && vertical && Math.abs(diffY) > DIRECTION_THRESHOLD) {
            e.preventDefault();
            // The row follows the finger and lifts up a little
            element.style.transform = `translateY(${diffY}px)`;
            element.style.opacity = '0.8';
            element.style.zIndex = '1000';
            element.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            vertical.preview(diffY);
        }
    }, { passive: false });

    element.addEventListener('touchend', () => {
        const swipedHorizontally = direction === 'horizontal' && Math.abs(diffX) > SWIPE_DISTANCE;
        const swipedVertically = direction === 'vertical' && vertical && Math.abs(diffY) > vertical.threshold;

        // A callback that takes over the row (slide-out, re-render) means: leave it alone
        let handled = false;
        if (swipedHorizontally && diffX < 0 && onSwipeLeft) {
            onSwipeLeft(element);
            handled = true;
        } else if (swipedHorizontally && diffX > 0 && onSwipeRight) {
            onSwipeRight(element);
            handled = true;
        } else if (swipedVertically) {
            handled = vertical.commit(diffY);
        }

        // Otherwise snap the row back into place
        if (!handled) resetRowStyle(element);
        vertical?.clear();
        showLabels(null);
        reset();
    }, { passive: true });

    element.addEventListener('touchcancel', () => {
        resetRowStyle(element);
        vertical?.clear();
        showLabels(null);
        reset();
    }, { passive: true });
}
