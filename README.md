# Lock-In Mode

Chrome extension for timed focus sessions. Ban the sites that distract you, pick the ones you need, set a timer and lock in. Opening a banned site ends the session and shows you a mission page instead.

## Features

- Ban list and pick list, with presets for study, work and deep focus
- Timed sessions with a Pomodoro option that gives a five-minute grace period at the start
- Banned pages are swapped for a mission page that reminds you what you are meant to be doing
- New-tab dashboard with focused minutes, sessions completed and broken, and the sites that broke them
- Suggested ban and pick lists for a topic, using Chrome's built-in Prompt API when the browser provides it
- Light, dark and system themes

## Install

1. Clone this repository.
2. Open `chrome://extensions`, turn on Developer mode and choose Load unpacked.
3. Select the cloned folder. The extension replaces the new tab page and adds a toolbar popup.

## Files

| File | Purpose |
|------|---------|
| `background.js` | Service worker that watches tabs, enforces the ban list and ends sessions on the timer |
| `newtab.html`, `newtab.js` | New-tab dashboard: presets, lists, timer and stats |
| `popup.html`, `popup.js` | Toolbar popup for quick sessions |
| `mission.html` | Page shown in place of a banned site |
| `ai-client.js` | Prompt API wrapper for list suggestions and motivation lines |
| `Content.js` | Content script injected into pages |
