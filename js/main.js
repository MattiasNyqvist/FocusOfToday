/**
 * Focus of Today - entry point
 *
 * Starts the app. The code is split like this:
 *   config.js    settings and storage keys
 *   storage.js   reading and writing task data (localStorage)
 *   actions.js   what the user can do with a task (add, edit, delete, done, move ...)
 *   events.js    "data changed" notification between actions and the screen
 *   ui/          everything that draws or reacts on the screen
 */

import { onDataChanged } from './events.js';
import { mountComponents } from './ui/components.js';
import { renderAll } from './ui/render.js';
import { initNavigation } from './ui/navigation.js';
import { initSettings } from './ui/settings.js';
import { initImportData } from './ui/import-data.js';
import { initHelp } from './ui/help.js';
import { initTaskInput } from './ui/task-input.js';
import { checkNewDay, watchForNewDay } from './ui/new-day.js';

// Module scripts run after the page has been parsed, so the DOM is ready here.
mountComponents();
initSettings();
initImportData();
initNavigation();
initTaskInput();
initHelp();

// Redraw whenever an action has changed the data
onDataChanged(renderAll);

checkNewDay();
watchForNewDay();

renderAll();
