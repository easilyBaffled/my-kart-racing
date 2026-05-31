# Rail Racing v2 — Product Requirements Document

**Date:** 2026-05-31  
**Status:** Draft  
**Scope:** Full rewrite / feature expansion from game jam prototype → shippable game

---

## Background

Rail Racing is a browser-based racing game built in 48 hours for the 2018 GMTK Game Jam. The core conceit — Mario Kart without driving — is strong and original: you can't control your speed, only your lane. The prototype proved the concept works and is fun.

v1 is an 801-line monolithic React component. It ships with: 3 lanes, 2 CPU opponents, a charging power-up system (boost + hazard), a 15-step tutorial, keyboard and touch input, and lap-based racing. The SVG car assets that were imported are never rendered; racers are colored circles. Audio is hosted on a third-party URL that could go dead at any time.

v2 is the transition from "game jam proof of concept" to a game people recommend to friends.

---

## Goals

1. **Polish the core loop** so it feels tight and complete, not like a prototype.
2. **Make it actually playable on mobile** — a large share of casual browser game traffic is touch-only.
3. **Add replayability** through track variety, difficulty options, and local leaderboards.
4. **Fix the architecture** so the game can be extended without rewrites.
5. **Remove all fragile external dependencies** (hosted audio files, etc.).

### Non-goals for v2

- Multiplayer over the network
- A track editor
- Account systems or cloud saves
- Monetization

---

## User Stories

| # | As a… | I want to… | So that… |
|---|--------|------------|----------|
| 1 | new player | understand the controls in under 30 seconds | I can start having fun immediately |
| 2 | returning player | pick a difficulty | the CPU doesn't feel random and the race is actually contested |
| 3 | mobile player | swipe reliably to switch lanes and deploy items | the game is fully playable without a keyboard |
| 4 | competitive player | see my best lap times saved locally | I have something to beat next session |
| 5 | casual player | race on more than one track layout | each session feels different |
| 6 | any player | see actual car shapes instead of dots | the game looks like it was intentionally made |
| 7 | any player | hear sound effects for collisions and hazards | audio feedback matches what's happening on screen |

---

## Feature Specifications

### 1. Architecture Rewrite (Required Foundation)

The entire game currently lives in one 801-line class component. This blocks every other feature on this list.

**Target structure:**

```
src/
  game/
    loop.js          # tick pipeline (movement, collisions, AI, lap logic)
    racer.js         # racer state + helpers
    hazard.js        # hazard types, creation, movement, collision
    ai.js            # CPU decision logic
    track.js         # path definitions, lap detection, position lookup
  input/
    keyboard.js
    touch.js
  audio/
    engine.js        # dynamic engine pitch
    sfx.js           # one-shot sound effects (bundled, not external URLs)
  ui/
    HUD.jsx          # lap counts, rankings, charge meters
    Track.jsx        # SVG lanes + all moving elements
    Racer.jsx        # individual racer shape + trail
    Hazard.jsx       # hazard rendering
    LapNotification.jsx
    Tutorial.jsx
    Menu.jsx
  App.jsx            # game state owner, wires input → loop → render
```

**Constraints:**
- Game loop must be decoupled from React render. Loop runs via `requestAnimationFrame`, writes to a ref, and triggers render via a single `setState` (or equivalent) at end of each frame.
- No Ramda lenses. Plain object spreads are fine; if immutability tooling is needed, use Immer.
- No `setTimeout` for the game loop. Use `requestAnimationFrame` with a frame delta to keep timing frame-rate independent.

**Acceptance criteria:**
- Gameplay identical to v1
- Adding a new hazard type requires touching only `hazard.js` and `Hazard.jsx`
- No file exceeds 300 lines

---

### 2. Real Car Sprites

v1 imported `blue_car.svg`, `green_truck.svg`, `orange_leaf.svg` but renders colored circles instead.

**Requirements:**
- Render the actual SVG assets for each racer
- Sprites rotate to match the tangent of the path at the racer's current `t` position (`getPointAtLength(t)` vs `getPointAtLength(t - 1)` gives the direction vector)
- Trail renders 7 ghost copies of the sprite at decreasing opacity (same as v1, but shaped correctly)
- Hazard objects get a distinct visual shape (not the same circle as racers)

**Out of scope:** user-selectable skins (v3 territory).

---

### 3. Multiple Tracks

v1 has one track with three fixed SVG paths. The game world never changes between sessions.

**Requirements:**
- Ship with **3 named tracks**, each with a distinct path geometry (tight turns vs long straights vs figure-8)
- Track is selected on the pre-race screen (see Menu below)
- Each track defines its own 3 lane paths, standard racer speed, and lap count (can vary: a short track might race 50 laps, a long one 20)
- Lap-time rating thresholds (Perfect / Great / Good / Ok / Bad / Failed) are calibrated per-track, not hardcoded globally

**Track definitions** live in `src/game/track.js` as plain data objects, not embedded in JSX.

---

### 4. Difficulty Settings

CPU opponents currently have one behavior: 10% chance per frame to deploy an item, with no strategy.

**Three difficulty levels:**

| Difficulty | CPU item frequency | CPU targeting | CPU speed variance |
|---|---|---|---|
| Easy | 5% per frame, items poorly aimed | never homes on player | ±10% of standard |
| Normal | 10% per frame (v1 behavior) | 20% chance to home on player | ±0% |
| Hard | 15% per frame, items better timed | 60% chance to home on player | +10% of standard |

Difficulty is set on the pre-race menu and stored in `localStorage` so it persists between sessions.

---

### 5. Pre-Race Menu

v1 drops you directly into the tutorial, then starts the race. There's no way to pick a track or adjust difficulty without reloading the page.

**Menu screens:**

```
Main Menu
├── Race
│   ├── Track select (3 thumbnails)
│   ├── Difficulty select (Easy / Normal / Hard)
│   └── Start Race
├── Best Times (see §6)
└── How to Play (condensed tutorial, replaces the in-race 15-step version)
```

**Race end screen:**
- Shows final standings (1st / 2nd / 3rd)
- Shows player's best lap time for this race, flagged if it's a new personal best
- Buttons: Race Again (same settings) | Change Track | Main Menu

---

### 6. Local Leaderboards (Best Lap Times)

No persistence exists in v1.

**Requirements:**
- Store the player's **best lap time per track** in `localStorage`
- Display on the Best Times screen: track name, best lap time, rating label (Perfect / Great / etc.)
- Display an in-race notification when the player beats their stored best ("New best! 00:04.2")
- No server, no accounts. Local only.

---

### 7. Bundled Audio

v1 loads audio from external CodeSandbox URLs. Those URLs can go dead.

**Requirements:**
- Bundle all audio files under `src/assets/audio/`
- Keep the existing dynamic engine pitch mechanic (pitch scales with speed)
- Add one-shot sound effects for:
  - Hazard hit (collision shake)
  - Boost pad pickup
  - Hazard deployed
  - Lap completed
  - Race won / race lost
- Horn remains on non-arrow keypress
- All audio managed through a single `sfx.js` module; no `<audio>` tags scattered through JSX

**File size constraint:** total audio assets ≤ 2 MB. Use compressed OGG with MP3 fallback.

---

### 8. Mobile Controls Overhaul

v1's touch handling uses a single stored `{clientX, clientY}` and computes direction on `touchend`. It has no dead zone, no velocity threshold, and no visual feedback.

**Requirements:**
- **Dead zone:** swipes shorter than 30px are ignored
- **Velocity threshold:** swipes that take longer than 400ms are ignored (prevents accidental triggers from slow drags)
- **Visual charge indicator:** the item charge meter must be visible and large enough to tap-target on mobile (min 44px touch target)
- **Viewport:** game scales to fill the screen width on mobile without overflow or scroll; SVG `viewBox` adjusts to aspect ratio
- Test on: iPhone SE viewport (375×667), standard Android (360×800), tablet (768×1024)

---

### 9. Revised Tutorial

The 15-step in-race tutorial runs on a 3.5-second auto-advance timer and blocks item charging for the first 6 steps. Players who already know the game can't skip it without reloading.

**Requirements:**
- Tutorial moves to the "How to Play" menu screen (non-interactive explainer with diagrams)
- First run: show a lightweight 3-step overlay at race start (lane switch → charge fills → deploy item), dismissible immediately with any input
- "How to Play" is always accessible from the main menu
- Tutorial state is stored in `localStorage`; returning players skip the overlay

---

### 10. Bug Fixes (Carry-over from v1)

These are confirmed bugs in the existing code that must be fixed before v2 ships:

| Bug | Location | Fix |
|---|---|---|
| `deployBoost` array copied into `deployHazzard` accumulator | `index.js` ~line 414 | Use correct accumulator variable |
| Game loop uses `setTimeout(tick, 16)` — frame timing drifts under load | `index.js` game loop | Switch to `requestAnimationFrame` with delta time |
| Speed restoration uses 1.01x/0.99x per frame — racers almost never return to standard speed | collision resolution | Replace with `lerp(currentSpeed, standardSpeed, 0.05)` per frame |
| SVG paths hardcoded inside JSX render — recalculated on every re-render | `index.js` | Move path `d` strings to constants outside the component |

---

## What Stays the Same

These v1 features work well and should be preserved without changes to their mechanics:

- Three-lane switching with wrap-around (`cycleThree`)
- Dual power-up actions: boost (up) vs hazard (down)
- Item charge meter filling passively over time
- Racer-to-racer collision (overtaking speed adjustments)
- Homing vs non-homing hazard variants
- 7-position motion trail
- Collision shake effect
- Lap time rating labels (recalibrated per-track in v2)
- Rankings display (by laps + lap percentage)

---

## Technical Constraints

- **Runtime:** Browser only. No server. No build-time environment variables.
- **React version:** Upgrade to React 18. Use functional components and hooks throughout. No class components.
- **State management:** React `useState` / `useReducer` for UI state. Game loop state lives in a `useRef` to avoid triggering renders on every frame; one `setState` per frame syncs the ref snapshot to React for rendering.
- **No new heavy dependencies.** Drop Ramda and Lodash. Standard JS is sufficient.
- **Bundler:** Upgrade from `react-scripts` 1.x to Vite. This removes the CRA abstraction and brings build times from ~45s to ~3s.
- **Browser targets:** Chrome 100+, Firefox 100+, Safari 15+, Chrome Android 100+.

---

## Success Metrics

| Metric | Target |
|---|---|
| Time-to-first-race on desktop | < 15 seconds from page load |
| Time-to-first-race on mobile | < 20 seconds from page load |
| Players who complete at least 3 races | > 60% of first-session players |
| Audio asset load failure rate | 0% (bundled, not external) |
| Frame rate on mid-range mobile (60fps target) | ≥ 55fps sustained |
| Largest file in the bundle | < 500 KB gzipped |

---

## Open Questions

1. **Track art direction:** Should tracks have a visual theme (desert / city / forest) or stay abstract/minimalist like v1? Theming adds scope; minimalism is faster to ship.
2. **AI lane switching:** v1 CPUs never change lanes. Should Hard-mode CPUs switch lanes to block the player? This requires pathfinding or heuristic logic.
3. **Item variety:** Are two item types (boost + hazard) enough, or should v2 add a third (shield, freeze, shortcut)? A third item type adds design surface but also balance work.
4. **Racer count:** v1 has 3 racers (player + 2 CPU). Would a 4-racer race feel more chaotic-fun or just harder to read visually in SVG?

---

## Milestones

| Milestone | Deliverables |
|---|---|
| M1 — Foundation | Architecture rewrite complete; all v1 behavior preserved; tests passing |
| M2 — Content | 3 tracks, 3 difficulty levels, pre-race menu, race-end screen |
| M3 — Polish | Car sprites, bundled audio + SFX, revised tutorial, mobile controls |
| M4 — Persistence | Local leaderboards, difficulty preference saved, first-run detection |
| M5 — Ship | Bug fixes, performance pass, browser testing, deploy |
