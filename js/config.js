/**
 * Configuration
 * App settings that the user can change, plus every localStorage key in one place.
 */

/** localStorage keys. Keep them here so nothing is stored under a "secret" name. */
export const STORAGE_KEYS = {
    tasks: 'focusTasks_v1',
    backlog: 'focusBacklog_v1',
    archive: 'focusArchive_v1',
    settings: 'focusSettings_v1',
    theme: 'theme',
    assistantHidden: 'assistantHidden',
    lastSeenDate: 'lastSeenDate'
};

/** Allowed range for the daily focus limit (matches the slider in Settings). */
export const FOCUS_LIMIT_MIN = 1;
export const FOCUS_LIMIT_MAX = 10;

/** Settings the user can change. Saved with saveSettings(). */
export const CONFIG = {
    /** Max number of focus tasks per day */
    maxFocusTasks: 6
};

/** Load saved settings into CONFIG. Invalid or missing values keep their defaults. */
export function loadSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.settings));
        const limit = saved?.maxFocusTasks;
        if (Number.isInteger(limit) && limit >= FOCUS_LIMIT_MIN && limit <= FOCUS_LIMIT_MAX) {
            CONFIG.maxFocusTasks = limit;
        }
    } catch (error) {
        console.error('Could not load settings:', error);
    }
}

/** Save the current CONFIG. */
export function saveSettings() {
    try {
        localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify({
            maxFocusTasks: CONFIG.maxFocusTasks
        }));
    } catch (error) {
        console.error('Could not save settings:', error);
    }
}

loadSettings();
