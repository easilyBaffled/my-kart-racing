# Rail Racing v2 — Product Requirements Document

**Date:** 2026-05-31  
**Status:** Draft  
**Scope:** Ground-up rebuild of Rail Racing

---

## Background

Rail Racing is a browser-based racing game originally built for the 2018 GMTK Game Jam around one central idea: Mario Kart without driving. You cannot control your speed — only your lane. The game jam prototype proved the concept is fun. v2 is the real game.

---

## Goals

1. **Make the core loop feel complete** — tight controls, readable visuals, meaningful audio feedback.
2. **Be fully playable on mobile** — touch is a first-class input, not an afterthought.
3. **Give players a reason to come back** — track variety, difficulty options, local best times.
4. **Ship a codebase that can be extended** — clean module boundaries, no monolithic files.

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
| 2 | returning player | pick a difficulty | the CPU feels like a real opponent, not a slot machine |
| 3 | mobile player | swipe reliably to switch lanes and deploy items | the game is fully playable without a keyboard |
| 4 | competitive player | see my best lap times saved locally | I have something to beat next session |
| 5 | casual player | choose from multiple tracks | each session feels different |
| 6 | any player | see car shapes moving along the track | the game reads immediately as a race |
| 7 | any player | hear sound effects for collisions and hazards | audio confirms what's happening on screen |

---

## Core Mechanics

These are the design pillars v2 is built around. They come from the prototype and are not up for debate — they define what the game is.

- **Lane switching is the only player control.** Three lanes, wrap-around, left/right input only. Speed is not player-controlled.
- **Dual power-up actions.** A charge meter fills passively over time. When full, the player chooses: deploy boost (speed up) or deploy hazard (slow an opponent).
- **Hazards have two behaviors: homing and non-homing.** Homing hazards track a target; non-homing travel in a straight line.
- **Racer-to-racer collision adjusts speed.** The trailing racer accelerates slightly; the leading racer slows. Both return to standard speed over time.
- **Lap-based racing with time ratings.** Each completed lap is rated (Perfect / Great / Good / Ok / Bad / Failed) based on how long it took. Ratings are calibrated per track.
- **Motion trail.** Each racer renders its last several positions at fading opacity.
- **Rankings update live** based on laps completed and current lap percentage.

---

## Feature Specifications

### 1. Architecture

**Module structure:**

```
src/
  game/
    loop.js       # tick pipeline: movement, collisions, AI, lap logic
    racer.js      # racer state and helpers
    hazard.js     # hazard types, creation, movement, collision detection
    ai.js         # CPU decision logic
    track.js      # path definitions, lap detection, position lookup
  input/
    keyboard.js
    touch.js
  audio/
    engine.js     # dynamic engine pitch
    sfx.js        # one-shot sound effects
  ui/
    HUD.jsx           # lap counts, rankings, charge meters
    Track.jsx         # SVG lanes and all moving elements
    Racer.jsx         # individual racer shape and trail
    Hazard.jsx        # hazard rendering
    LapNotification.jsx
    Tutorial.jsx
    Menu.jsx
  App.jsx         # game state owner; wires input → loop → render
```

**Constraints:**
- Game loop runs via `requestAnimationFrame` with frame delta. Timing is frame-rate independent.
- Loop state lives in a ref; one setState per frame syncs it to React for rendering. The loop never causes mid-frame re-renders.
- Adding a new hazard type requires changes only in `hazard.js` and `Hazard.jsx`.
- No file exceeds 300 lines.

**Stack:**
- React 18, functional components and hooks only
- Vite as bundler
- No heavy utility libraries — standard JS throughout

---

### 2. Car Sprites

**Requirements:**
- Each racer renders as a distinct SVG vehicle shape (car, truck, etc.), not a circle
- Sprites rotate to match the path tangent at the racer's current position
- The motion trail renders ghost copies of the sprite at decreasing opacity
- Hazard objects have a visually distinct shape from racers

**Out of scope:** user-selectable skins.

---

### 3. Tracks

**Requirements:**
- Ship with **3 named tracks**, each with a distinct path geometry (e.g., tight turns, long straights, figure-8)
- Track is selected before the race on the pre-race screen
- Each track defines its 3 lane paths, standard racer speed, lap count, and lap-time rating thresholds
- Track definitions are plain data objects in `src/game/track.js`, not embedded in JSX

---

### 4. Difficulty

**Three levels:**

| Difficulty | CPU item frequency | CPU targeting | CPU speed |
|---|---|---|---|
| Easy | Low; items rarely aimed well | Never homes on the player | Slightly below standard |
| Normal | Moderate | Occasionally homes on the player | Standard |
| Hard | High; items better timed | Usually homes on the player | Slightly above standard |

- CPU opponents can switch lanes on Hard difficulty to block or overtake
- Difficulty is selected before the race and persists in `localStorage`

---

### 5. Menus

**Screen map:**

```
Main Menu
├── Race
│   ├── Track select (3 thumbnails with preview paths)
│   ├── Difficulty select (Easy / Normal / Hard)
│   └── Start Race
├── Best Times
└── How to Play
```

**Race end screen:**
- Final standings (1st / 2nd / 3rd)
- Player's best lap time for the race, flagged if it's a new personal best
- Actions: Race Again (same settings) | Change Track | Main Menu

---

### 6. Local Leaderboards

**Requirements:**
- Store the player's best lap time per track in `localStorage`
- Best Times screen shows: track name, best lap time, rating label
- In-race notification when the player beats their stored best (e.g., "New best! 4.2s")
- No server, no accounts. Local storage only.

---

### 7. Audio

**Requirements:**
- All audio assets bundled under `src/assets/audio/` — no external URLs
- Engine sound with dynamic pitch that scales with the player's current speed
- Horn on non-directional keypress
- Background music
- One-shot sound effects for: hazard hit, boost pad pickup, hazard deployed, lap completed, race won, race lost
- All audio managed through `sfx.js`; no scattered `<audio>` tags in JSX

**File size constraint:** total audio ≤ 2 MB. OGG with MP3 fallback.

---

### 8. Mobile Controls

**Requirements:**
- **Dead zone:** swipes shorter than 30px are ignored
- **Velocity threshold:** swipes longer than 400ms are ignored (prevents accidental slow-drag triggers)
- **Charge meter:** large enough to read at a glance on a phone screen; min 44px touch target for any interactive element
- **Viewport:** game scales to fill screen width without scroll or overflow; SVG `viewBox` adapts to the device aspect ratio

**Test targets:** iPhone SE (375×667), standard Android (360×800), tablet (768×1024)

---

### 9. Tutorial

**Requirements:**
- "How to Play" is a dedicated menu screen: a non-interactive explainer with labeled diagrams covering lane switching, the charge meter, boost vs hazard, and collision behavior
- First session: a 3-step dismissible overlay at race start (switch lanes → charge fills → deploy an item). Any input advances or skips it.
- The overlay does not block gameplay while it is displayed
- Returning players (detected via `localStorage`) skip the overlay entirely

---

## Technical Constraints

- **Runtime:** Browser only. No server.
- **React:** 18, functional components and hooks. No class components.
- **State:** UI state in `useState` / `useReducer`. Game loop state in `useRef`; one `setState` per frame for rendering.
- **Bundler:** Vite
- **Dependencies:** Minimal. No Ramda, no Lodash. Standard JS.
- **Browser targets:** Chrome 100+, Firefox 100+, Safari 15+, Chrome for Android 100+

---

## Success Metrics

| Metric | Target |
|---|---|
| Time-to-first-race on desktop | < 15 seconds from page load |
| Time-to-first-race on mobile | < 20 seconds from page load |
| Players who complete at least 3 races | > 60% of first-session players |
| Audio asset load failure rate | 0% |
| Sustained frame rate on mid-range mobile | ≥ 55 fps |
| Largest bundle file (gzipped) | < 500 KB |

---

## Open Questions

1. **Track art direction:** Do tracks get visual themes (desert / city / forest) or stay abstract and minimalist? Themes add polish and scope; minimalism ships faster.
2. **Item variety:** Two item types (boost + hazard) or three? A third type (shield, freeze, shortcut) adds design space but also balance work.
3. **Racer count:** 3 racers (player + 2 CPU) or 4? More racers means more chaos and more hazards on screen — could be fun or could be noise.
4. **Collision shake:** Screen shake on hazard hit is useful feedback but potentially a problem for players sensitive to motion. Should there be a reduced-motion option in v2 or defer to v3?

---

## Milestones

| Milestone | Deliverables |
|---|---|
| M1 — Foundation | Module architecture, game loop, core mechanics playable, input handling |
| M2 — Content | 3 tracks, 3 difficulty levels, AI lane switching on Hard |
| M3 — Menus | Pre-race menu, race-end screen, How to Play screen |
| M4 — Polish | Car sprites, bundled audio + SFX, mobile viewport and controls |
| M5 — Persistence | Local leaderboards, difficulty preference, first-run detection, tutorial overlay |
| M6 — Ship | Performance pass, cross-browser testing, deploy |
