# diansss.com Project Guide

This project is a static VTuber fan website.

## Project Type

A lightweight static fan website for a VTuber / VTB homepage. The site is mainly used for profile display, external links, fan content, and future small widgets.

## Tech Stack

Use only:

- HTML
- CSS
- JavaScript

Do not use:

- React
- Vue
- Next.js
- Nuxt
- Svelte
- backend frameworks
- databases
- login systems
- payment systems
- unnecessary third-party libraries

## Current Structure

- index.html: homepage markup
- css/style.css: global styles and responsive layout
- js/main.js: homepage interactions
- assets/images/: image assets
- README.md: project notes

## Current Homepage Features

- Sticky top navigation
- Hero banner
- Circular avatar
- VTuber name display
- bilibili homepage button
- bilibili live room button
- Twitter link
- Marshmallow link
- Follower count placeholder
- Catchphrase carousel
- Three bilibili dynamic placeholder cards
- Bottom scroll button

## Development Rules

1. Keep the project simple and beginner-friendly.
2. Do not introduce frameworks unless explicitly requested.
3. Do not add backend services or databases unless explicitly requested.
4. Do not connect real APIs unless explicitly requested.
5. Keep all styles in css/style.css.
6. Keep homepage scripts in js/main.js.
7. Keep assets under assets/images/.
8. Preserve responsive design.
9. Avoid unsafe innerHTML usage, especially for user-provided content.
10. External links should use target="_blank" and rel="noopener noreferrer".
11. Before making large changes, explain which files will be modified.
12. After changes, summarize the changes and list testing steps.

## Preferred Workflow

For each task:

1. Read the relevant files first.
2. Summarize the current state.
3. Propose a small change plan.
4. Wait for confirmation before large edits.
5. Modify only necessary files.
6. Provide a concise summary and testing checklist.