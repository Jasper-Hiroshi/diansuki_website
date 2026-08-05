## Mandatory cache-busting rule

Whenever you modify any `.css` or `.js` file, you MUST update the `?v=` version parameter for that modified asset in every HTML file that references it.

Use one timestamp in `YYYYMMDDHHMMSS` format for all modified assets in the same task.

Example:

css/style.css
→ css/style.css?v=20260804153000

js/main.js
→ js/main.js?v=20260804153000

If an existing `v=` parameter exists, replace it.

Do not finish the task until all references have been checked.
Do not bump versions for CSS/JS files that were not modified.
