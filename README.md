# Pivot — AI-Powered LeetCode Coach

A Chrome extension that sits on top of LeetCode and turns every submission into a learning moment. Pivot tracks your attempts, detects when you're stuck, and gives you a targeted hint from an AI coach — without just handing you the answer.

![Pivot AI Coach catching a real bug](image.png)
*Real example: Pivot correctly diagnosed that `diff` was never being calculated as `target - n`, catching a bug that caused every test case to fail.*

## The Problem

Grinding LeetCode in isolation is inefficient. You either:
- Stare at a wrong answer with no idea what's actually broken, or
- Immediately jump to the editorial/solution and learn nothing about debugging your own logic

Most tracking tools just log pass/fail. They don't help you find the bug in *your* code.

## What Pivot Does

- **Watches your submissions in real time** via a content script injected into the LeetCode problem page
- **Detects wrong answers** and captures your current code + the problem context
- **Sends it to an LLM** (via OpenRouter, so you can pick any model) for a targeted, specific hint — not a generic "check your logic" but an actual pointer to the broken line
- **Tracks submission history and a day streak** to keep grinding consistent, gamification-lite
- **BYOK (Bring Your Own Key)** — your OpenRouter API key is stored locally, so there's no backend cost to run and no server holding your data

## Architecture

```
LeetCode Problem Page
      │
      ▼
Content Script (injected)
  - Reads problem metadata (title, test cases, expected output)
  - Detects submission result via DOM/network observation
  - Extracts current editor code
      │
      ▼
Background Service Worker
  - Formats a prompt: problem + code + failing test case
  - Calls OpenRouter API with the user's stored key
      │
      ▼
Sidebar UI (injected)
  - Renders the AI Coach hint inline, next to the editor
  - Displays submission history + day streak from local storage
```

**Stack:** Chrome Extension (Manifest V3), vanilla JS/TS content + background scripts, `chrome.storage.local` for persistence, OpenRouter API for LLM inference.

## Key Design Decisions

- **No backend.** Storing the API key client-side and calling OpenRouter directly from the extension means zero hosting cost and zero server-side data retention — a deliberate tradeoff favoring privacy and simplicity over features like cross-device sync.
- **Hints, not solutions.** The coach is prompted to point at the specific broken logic rather than rewrite the function, to keep the tool aligned with learning rather than copy-pasting.
- **Manifest V3 service worker** instead of a persistent background page, in line with Chrome's current extension platform requirements.

## Status

Currently a working proof-of-concept: submission tracking, streak counter, and AI-generated hints are all functional end-to-end on LeetCode's problem pages.

**Planned next:**
- Full solution walkthrough on request (currently hint-only)
- Multiple alternative approaches per problem
- Pattern-tagging across problems (e.g. "you consistently struggle with sliding window")

## Installation

Pivot isn't on the Chrome Web Store yet (coming soon — see below), so for now it runs as an unpacked extension. This takes about 2 minutes.

### 1. Get the code
```bash
git clone https://github.com/DhruvMalviya0/pivot.git
cd pivot
```
Or download the ZIP from GitHub and extract it somewhere permanent — **don't delete or move this folder after installing**, Chrome loads the extension directly from it.

### 2. Load it into your browser

**Chrome / Brave / Edge (any Chromium-based browser):**
1. Open `chrome://extensions` (or `brave://extensions`, `edge://extensions`)
2. Toggle **Developer mode** on — top right corner of the page
3. Click **Load unpacked**
4. Select the `pivot` folder you just cloned/extracted (the one containing `manifest.json`)
5. Pivot's icon should now appear in your extensions toolbar — pin it for easy access

### 3. Add your OpenRouter API key
1. Click the Pivot icon in your toolbar to open the sidebar
2. Paste your OpenRouter API key into the **OpenRouter API Key** field
3. Click **Save Key**

Don't have a key yet? Grab one free at [openrouter.ai](https://openrouter.ai) — sign up, go to Keys, generate one. OpenRouter gives access to many models (including free-tier options), so you're not locked into a single provider.

### 4. Start solving
1. Open any [LeetCode](https://leetcode.com) problem
2. Write your solution as normal
3. Hit **Run** or **Submit** — Pivot picks up the result automatically and, if it's wrong, the AI Coach panel pops up in the bottom-right with a targeted hint

### Updating later
If you pull new changes from the repo, go back to `chrome://extensions` and click the refresh icon on the Pivot card — no need to remove and re-add it.

### Troubleshooting
- **Extension doesn't load** — make sure you selected the folder containing `manifest.json`, not a parent or child folder
- **No hint appears on Run/Submit** — open DevTools (F12) → Console tab on the LeetCode page, check for `[Pivot]` log lines to see what's being detected
- **"Invalid API key" errors** — double check you copied the full key from OpenRouter with no trailing spaces

---

*Once published to the Chrome Web Store, this section will be replaced with a one-click install link.*

## Why "Pivot"

Named for the moment you get stuck and need to shift your approach — the extension's whole job is helping you find that pivot point faster than staring at a wall of red test cases would.