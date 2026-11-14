/**
 * Settings view
 * The focus limit, the assistant switch, the theme and the data export.
 */

import { CONFIG, STORAGE_KEYS, saveSettings } from '../config.js';
import { exportData, readPref, writePref } from '../storage.js';
import { notifyDataChanged } from '../events.js';
import { showToast } from './toast.js';
import { isAssistantVisible, setAssistantVisible } from './assistant.js';

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

/** Show the saved settings in the form and connect the controls. Call once at start. */
export function initSettings() {
    // --- Focus limit: the number follows the slider, the value is saved on release ---
    const slider = document.getElementById('maxFocusTasks');
    const sliderValue = document.getElementById('maxFocusTasksValue');
    slider.value = String(CONFIG.maxFocusTasks);
    sliderValue.textContent = CONFIG.maxFocusTasks;

    slider.addEventListener('input', () => {
        sliderValue.textContent = slider.value;
    });
    slider.addEventListener('change', () => {
        CONFIG.maxFocusTasks = Number(slider.value);
        saveSettings();
        notifyDataChanged();
        showToast('✓ Settings saved');
    });

    // --- Assistant ---
    const assistantCheckbox = document.getElementById('showAssistant');
    assistantCheckbox.checked = isAssistantVisible();
    assistantCheckbox.addEventListener('change', () => {
        setAssistantVisible(assistantCheckbox.checked);
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
