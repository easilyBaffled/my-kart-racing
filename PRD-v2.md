# Rail Racing v2 — Product Requirements Document

**Date:** 2026-05-31  
**Status:** Draft  
**Scope:** Ground-up rebuild of Rail Racing

---

## Background

Rail Racing is a browser-based racing game originally built for the 2018 GMTK Game Jam around one central idea: Mario Kart without driving. You cannot control your speed — only your lane. The game jam prototype proved the concept is fun. v2 is the real game.

---

## Design Pillars

These define what the game is. New mechanics must fit within them.

- **Lane switching is the only player control.** Three lanes, wrap-around, left/right only. Speed is never directly controlled.
- **Passive charging, active choice.** The charge meter fills on its own. The interesting decision is what you do when it's full.
- **Position is everything.** Lane, proximity to opponents, and track position all matter. Reading the race and reacting is the skill.

---

## New Mechanics

### Slipstream

Following directly behind another racer gives a small, automatic speed boost. The closer and longer you trail, the stronger the effect. Breaking out of the slipstream to overtake costs you that boost — so there's a genuine strategic question about when to make the move.

This makes lane-switching meaningful even when no hazards are active. It also makes the CPU opponents dangerous to be behind, not just in front of.

---

### Boost Pads

Fixed positions on each track where a speed boost is available — but only if you're in the right lane at the right moment. They're visible in advance, so hitting one is a skill reward, not luck.

Unlike the player-deployed boost, pads affect anyone who runs over them. CPU opponents will go for them too.

---

### Expanded Item Roster

The prototype has two item actions: boost and hazard. v2 adds a third item type drawn randomly when the charge meter fills, giving the player something to manage beyond a binary choice.

**New items:**

| Item | Effect |
|---|---|
| **Shield** | Absorbs the next incoming hazard. Single use. Visible on the racer while active. |
| **Oil Slick** | Drops a persistent hazard on the player's current lane. Anyone passing through it — including the player — gets slowed. Fades after a few seconds. |
| **Fake Boost Pad** | Places a decoy that looks like a boost pad but slows whoever hits it. |

The existing boost (speed up) and homing hazard remain. The player now holds one item at a time and chooses when to use it, rather than deploying immediately on charge.

---

### Collision with Consequence

Prototype collisions just nudge speeds. v2 makes contact feel like contact.

- **Sideswipe:** Two racers in the same lane collide when one catches the other. The trailing racer bounces to an adjacent lane if one is free; if not, they slow sharply.
- **Hazard hit:** Being struck by a hazard now has a brief recovery window — the racer moves at reduced speed and cannot switch lanes for a moment, making the hit feel punishing rather than just a speed tax.

---

### Rubber Band (Hard Difficulty Only)

On Hard, CPU opponents adjust their aggression based on race position. A CPU that's lapping behind the player will target them more aggressively with items. A CPU in the lead will play more defensively, hoarding the shield. This keeps the race feeling contested rather than decided early.

---

## Visual Improvements

### Racer Sprites

Each racer is a distinct vehicle — a car, a truck, a kart — that rotates to face the direction of travel along the track. No more colored circles.

Sprite design principles:
- Silhouettes that read clearly at small sizes
- Each racer has a unique shape, not just a color swap
- The player's vehicle is the most visually distinctive — instantly identifiable in a cluster

---

### Particle Effects

| Trigger | Effect |
|---|---|
| Hazard hit | Sparks burst from the struck racer |
| Boost (item or pad) | Flame trail behind the racer for the duration |
| Oil slick active | Subtle slick shimmer on the lane surface |
| Sideswipe collision | Small debris pop between the two racers |
| Lap completed | Brief confetti burst at the finish line |

Particles are cosmetic only and should not obscure the track or other racers.

---

### Hazard Visuals

Each hazard type gets a distinct look so the player can identify the threat before it hits.

| Hazard | Visual |
|---|---|
| Homing hazard | Pulsing, pointed shape that visibly rotates toward its target |
| Non-homing hazard | Flat, tumbling shape — clearly drifting, not tracking |
| Oil slick | Spreading iridescent patch on the lane |
| Fake boost pad | Identical to a real boost pad until hit |
| Shield | Soft glow around the protected racer |

---

### Speed Feedback

The game currently gives no visual indication of how fast a racer is moving relative to standard speed.

- At high speed (boost active): slight motion blur on the racer, the trail lengthens
- At low speed (hazard penalty): racer visual desaturates slightly, trail shortens
- Returning to standard speed: smooth transition back to baseline

---

### Track Environments

Each of the 3 tracks has a distinct visual theme that affects background color, lane styling, and boost pad appearance — but not readability. Track elements that the player needs to react to (hazards, boost pads, other racers) always have the same contrast priority regardless of theme.

---

## Everything Else (Unchanged in Scope)

These features are in v2 but not the focus of this cycle. Specs are minimal.

- **3 tracks** with distinct layouts
- **3 difficulty levels** with CPU behavior tables as previously defined
- **Menus:** track select, difficulty select, race-end screen
- **Local best times** per track, saved on device
- **Tutorial overlay** for first-time players, skippable
- **Mobile:** swipe controls, screen scaling

---

## Open Questions

1. **Item randomness:** Should item draws be fully random, or weighted by race position (losing racers get better items)? Position-weighting is more fair but less legible.
2. **Oil slick self-damage:** Should the player who dropped the oil slick be immune to it? Makes it easier to use but removes a risk dynamic.
3. **Fake boost pad tells:** Should the fake pad have a very subtle visual difference that expert players can learn to spot? Or is it a pure bluff with no tell?
4. **Slipstream visibility:** How do we show the player they're in a slipstream? Options: airflow lines behind the leading racer, a UI indicator, an audio pitch shift.
5. **Track themes:** Abstract/minimalist or named environments (desert, city, forest)?
