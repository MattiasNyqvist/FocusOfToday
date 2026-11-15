# Focus of Today

A minimalist task manager based on the Ivy Lee Method: choose what matters today, and finish it.
Pick your top 6 tasks for the day (adjustable), number them in order of importance,
and work through them one at a time. Everything is stored in the browser (localStorage);
there is no server and no account.

## Running locally

The app uses ES modules, which browsers block when `index.html` is opened directly from disk (`file://`). You will see CORS errors such as *"Access to script ... from origin 'null' has been blocked"*. Serve the folder over HTTP instead:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.

Alternatives: the **Live Server** extension in VS Code, or `npx serve`.

There is no build step and there are no dependencies: edit a file and reload the page.

## How it works

- The idea: this is not a list of everything to do. It is a place to **choose what matters today**
  and finish it. Everything else waits.
- **Today** has two parts. *Today's focus* is a fixed number of numbered places (max 6, adjustable),
  and the free places are drawn as empty slots. The counter (`1/5 (max 6)`) is finished / chosen tasks
  and the most you can choose. *Everything else* is where every task is written down first.
- **Focus** (the button on each task in *Everything else*) puts it in today's focus. If the focus is full, a dialog asks which task
  should give way (`swap-dialog.js`) instead of showing an error.
- A task marked as done stays in today's focus, struck through, for the rest of the day.
  It moves to **Done** (the archive) the next day.
- **Later** (the backlog) holds tasks that matter, but not today.
- The first time the app is opened on a new day (also after a weekend), the **new-day review**
  asks what to do with focus tasks that are still open: keep them or move them to **Later**.
- There is no tutorial or Help page. The screen explains itself (empty slots, "Pick a task", the swap
  dialog), and a **?** next to the focus heading opens a short "How it works" dialog (also in Settings).
- Quick capture sits in a bar above the navigation on Today, so a task can be added from anywhere
  on the screen.
- Every swipe has a button too, so the app works with a mouse and without gestures.

The code still calls the lists `tasks`, `backlog` and `archive`; the screen calls them
*Today*, *Later* and *Done*.

## Project structure

```
index.html            All markup. The header is a <template> that main.js copies into every view.
css/styles.css        All styles. Colors are variables in :root (dark mode redefines them).
scripts/bump-build.sh Sets the build number in index.html to <date>.<serial>.
js/
  main.js             Entry point: starts everything.
  config.js           Settings the user can change + every localStorage key.
  storage.js          The only place that reads/writes task data (localStorage).
  actions.js          What the user can do with a task: add, edit, delete, done, move ...
  events.js           "Data changed" notification, so actions never depend on rendering code.
  ui/
    render.js         Redraws all lists.
    task-list.js      Today view (focus slots + Everything else).
    swap-dialog.js    Asks which focus task gives way when the focus is full.
    simple-lists.js   Later and Done views.
    task-row.js       Pieces shared by all rows: icon buttons, swipe frame, inline editing.
    gestures.js       Swipe handling (touch). Every swipe also has a button on the row.
    reorder.js        Reordering: swipe up/down (touch) and drag and drop by the grip (mouse).
    help.js           The "How it works" dialog.
    new-day.js        The new-day review dialog.
    settings.js       Settings view (focus limit, theme, export).
    import-data.js    Restores a backup (checked first, confirmed by the user).
    navigation.js     Switching between views.
    components.js     Copies <template>s into the page.
    icons.js          All SVG icons in one place.
    toast.js          Small messages with optional UNDO.
    celebration.js    Confetti when a task is done.
    task-input.js     The quick capture field above the navigation.
```

The data flow is one-way: the UI calls an **action**, the action changes data through
**storage** and calls `notifyDataChanged()`, and `main.js` redraws the screen.

## Data

Tasks are stored in three lists (`tasks`, `backlog`, `archive`) with the same shape;
see the comment at the top of `js/storage.js`. *Settings → Export data* downloads all of it as JSON.

## Versioning

The version is set by hand in `index.html` (Settings footer). The build number is
`<date>.<serial>`, for example `20261114.2`. Update it before each release:

```bash
./scripts/bump-build.sh
```

## License

See [LICENSE](LICENSE).
