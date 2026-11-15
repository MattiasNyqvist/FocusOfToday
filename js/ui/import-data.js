/**
 * Import data (Settings)
 * Restores a backup made with "Export data". The file is checked first, and the user
 * must confirm before it replaces the current tasks.
 */

import { CONFIG, saveSettings } from '../config.js';
import { parseBackup, importData } from '../storage.js';
import { notifyDataChanged } from '../events.js';
import { showToast } from './toast.js';
import { syncFocusLimitControl } from './settings.js';

/** "1 task" / "3 tasks" */
const count = (n) => `${n} task${n === 1 ? '' : 's'}`;

/** Ask the user to confirm. Resolves to true if they choose to replace their data. */
function confirmReplace(backup) {
    const dialog = document.getElementById('importDialog');
    document.getElementById('importText').textContent =
        `The backup has ${count(backup.tasks.length)} on Today, ${count(backup.backlog.length)} in Later ` +
        `and ${count(backup.archive.length)} in Done. All your current data will be replaced. ` +
        'This cannot be undone.';

    return new Promise(resolve => {
        const finish = (answer) => {
            dialog.close();
            resolve(answer);
        };
        document.getElementById('importCancel').onclick = () => finish(false);
        document.getElementById('importConfirm').onclick = () => finish(true);
        dialog.oncancel = () => resolve(false); // Escape
        dialog.showModal();
    });
}

/** Read the chosen file, confirm, and replace the data. */
async function importFromFile(file) {
    let backup;
    try {
        backup = parseBackup(await file.text());
    } catch (error) {
        showToast(`⚠ Import failed: ${error.message}`);
        return;
    }

    if (!await confirmReplace(backup)) return;

    if (!importData(backup)) {
        showToast('⚠ Import failed: the data could not be saved');
        return;
    }
    if (backup.maxFocusTasks !== null) {
        CONFIG.maxFocusTasks = backup.maxFocusTasks;
        saveSettings();
        syncFocusLimitControl();
    }
    notifyDataChanged();
    showToast('✓ Data imported');
}

/** Connect the Import button. Call once at start. */
export function initImportData() {
    const fileInput = document.getElementById('importFile');

    document.getElementById('importDataBtn').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async () => {
        const [file] = fileInput.files;
        fileInput.value = ''; // so the same file can be chosen again
        if (file) await importFromFile(file);
    });
}
