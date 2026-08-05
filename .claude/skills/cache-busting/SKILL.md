# Cache Busting for Static Assets

## Purpose

Whenever CSS or JavaScript files are modified, update the version query parameter in every HTML file that references the modified assets so browsers do not continue using stale cached files.

## Rules

1. Before finishing any task, inspect which `.css` and `.js` files were modified.

2. If no CSS or JavaScript file was modified:
   - Do not change asset version parameters.

3. If one or more CSS/JS files were modified:
   - Generate one version value for the current task.
   - Use format: YYYYMMDDHHMMSS.
   - Use the same version value for all assets modified in this task.

4. Search all `.html` files in the repository for references to each modified asset.

5. Update or append the `v` query parameter.

Examples:

Before:
<link rel="stylesheet" href="css/style.css">

After:
<link rel="stylesheet" href="css/style.css?v=20260804153000">

Before:
<script src="js/main.js?v=20260801120000"></script>

After:
<script src="js/main.js?v=20260804153000"></script>

6. Only bump the version of assets actually modified.

7. Preserve paths, filenames, other query parameters, HTML structure, and unrelated code.

8. If the same CSS/JS file is referenced by multiple HTML pages, update every reference.

9. Before completing the task, verify that:
   - every modified CSS/JS asset has a new `v=` value;
   - all HTML references to that asset use the same version;
   - no unchanged asset was unnecessarily version-bumped.

10. Report the version value used in the final task summary.

## Completion requirement

A task that modifies CSS or JavaScript is not complete until the corresponding HTML asset version references have been updated and verified.
