# Tarini - Do it for me (browser extension)

## What's new in 1.4 - the + button
- Tap **+** in the panel (or drag a file onto it) to add a PDF, image, text or CSV file. Tarini reads it together with the page, so you can say "compare this quotation with the order lines on this page".
- Up to 5 files, 10 MB each. They stay with the task even when Odoo changes page.

## What's new in 1.3 - fewer approvals
- **Smart mode is now the default.** Clicking, typing, scrolling and opening menus run by themselves (with a short ring so you can see them). Saving counts down 3 seconds so you can stop it. Anything that confirms, sends, posts, pays, deletes or discards ALWAYS waits for your OK.
- **The plan starts by itself** after 6 seconds. Tap Change or Cancel before then if you want to.
- **Prefer to approve everything?** Open Tarini and choose "Ask every step". In that mode, "Approve all low-risk" lets one tap cover the rest of the task's safe steps.
- **Odoo aware.** On Odoo pages Tarini knows how lookup fields, order lines, Save and status buttons work.
- Finished steps shrink to one line so the panel stays easy to read.

## What is new in 1.2: Tarini lives inside the page
- A small **Tarini tab sits on the right edge of every web page**. Click it and the Tarini panel opens inside the page, and the page shifts left to make room. No new tab, no separate window.
- **Toolbar icon** or **Alt + Y** also opens and closes it.
- **Drag the tab up or down** to move it. Hover it and press the small x to hide it on that site (Settings brings it back).
- **Drag the panel's left edge** to make it wider or narrower.
- The **panel icon in the header** switches between pushing the page aside and floating over it (use floating if a site's layout looks odd when pushed).
- If the page reloads in the middle of a task (for example after a click on a normal website), the panel reopens by itself and Tarini carries on from the same step.
- When Tarini is waiting for your OK and the panel is closed, a red dot pulses on the tab.
- Tarini hides itself for a moment when it looks at the page, so its own panel is never part of what it reads.


## Flat layout
This build keeps every file in ONE folder (no icons/ or fonts/ subfolders), so it works exactly as you upload it to GitHub: select all files and drag them in.

## Install (Chrome or Edge, Windows or Mac)
1. Unzip this file. Keep the folder somewhere permanent, for example Documents/Tarini_Agent.
2. Open chrome://extensions (Edge: edge://extensions).
3. Turn on **Developer mode** (top right in Chrome, left side in Edge).
4. Click **Load unpacked** and choose the unzipped folder (the one that contains manifest.json).
5. Click the puzzle icon in the toolbar and pin **Tarini**.
6. Click the Tarini icon. The side panel opens. Paste your Tarini passkey in Settings and press Test connection.

## Quickest way (no new tab, no screen share)
- **Select text** on any web page: the yellow Tarini face appears. Click it.
- **Hold Alt and click** any button, field, number or row: Tarini opens right there.
- **Alt + T**: ask about the whole page. Change the shortcut at chrome://extensions/shortcuts.
- Pick **Explain**, **How do I…** (numbered markers appear on the page) or **Do it for me** (opens the panel and does it step by step with your OK).

## Use the panel
1. Open the website you want to work on (Odoo, a supplier portal, Gmail, a form).
2. Type or say the task in the panel and press Start.
3. Approve the plan, then approve each step. The element Tarini wants to use is highlighted on the page.
4. Press Stop at any time.

## Safety
- Plan first, then one approved step at a time.
- "Ask for risky steps" mode still asks before anything that sends, saves, pays, confirms or deletes.
- Never types passwords, card numbers, bank details or one-time codes.
- Text on websites is treated as data, never as instructions.
- Logs: Downloads/Tarini Library/<date>/<time> <name> - Do it for me - <task>/ (log.md plus a screenshot per step).

Tip: if Chrome asks where to save every download, turn off "Ask where to save each file" in Settings > Downloads, or switch off screenshots in Tarini's settings.
