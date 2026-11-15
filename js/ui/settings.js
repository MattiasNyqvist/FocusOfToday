/**
 * Settings view
 * The focus limit, the theme and the data export
 * (importing is in import-data.js).
 */

import { CONFIG, STORAGE_KEYS, saveSettings } from '../config.js';
import { exportData, readPref, writePref } from '../storage.js';
import { notifyDataChanged } from '../events.js';
import { showToast } from './toast.js';

/** Light or dark appearance. */
function applyTheme(theme) {
    document.body.classList.toggle('dark-mode', theme === 'dark');
    writePref(STORAGE_KEYS.theme, theme);
}

/** Download all data as a JSON file. */
function exportToFile() {
    const json = JSON.stringify(exportData(), null, 2);
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));

    const link = document.createElement('a');
    link.href = url;
    link.download = `focus-of-today-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();

    URL.revokeObjectURL(url);
    showToast('✓ Data exported');
}

/** Show the current focus limit in the slider and its label. */
export function syncFocusLimitControl() {
    document.getElementById('maxFocusTasks').value = String(CONFIG.maxFocusTasks);
    document.getElementById('maxFocusTasksValue').textContent = CONFIG.maxFocusTasks;
}

/** Show the saved settings in the form and connect the controls. Call once at start. */
export function initSettings() {
    // --- Focus limit: the number follows the slider, the value is saved on release ---
    const slider = document.getElementById('maxFocusTasks');
    const sliderValue = document.getElementById('maxFocusTasksValue');
    syncFocusLimitControl();

    slider.addEventListener('input', () => {
        sliderValue.textContent = slider.value;
    });
    slider.addEventListener('change', () => {
        CONFIG.maxFocusTasks = Number(slider.value);
        saveSettings();
        notifyDataChanged();
        showToast('✓ Settings saved');
    });

    // --- Theme ---
    const theme = readPref(STORAGE_KEYS.theme) === 'dark' ? 'dark' : 'light';
    document.getElementById(theme === 'dark' ? 'themeDark' : 'themeLight').checked = true;
    applyTheme(theme);
    document.querySelectorAll('input[name="theme"]').forEach(radio => {
        radio.addEventListener('change', () => applyTheme(radio.value));
    });

    // --- Export ---
    document.getElementById('exportDataBtn').addEventListener('click', exportToFile);
}
