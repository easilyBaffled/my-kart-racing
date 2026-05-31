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

When the charge meter fills, the player draws one item. The draw is weighted by race position — racers further behind get higher odds of powerful items. The player holds the item until they choose to use it.

**Full item table:**

| Item | Effect | Weight (1st → last) |
|---|---|---|
| **Boost** | Short speed burst | High → High |
| **Homing Hazard** | Tracks a target racer, slows on hit | High → Medium |
| **Shield** | Absorbs the next incoming hazard. Visible as a glow on the racer while active. | Medium → Medium |
| **Oil Slick** | Drops a persistent slow-zone on the player's current lane. The deployer is immune; everyone else is not. Fades after a few seconds. | Medium → High |
| **Fake Boost Pad** | Places a decoy with a subtle visual difference from a real pad. Slows whoever hits it. | Medium → High |
| **Lane Lock** | Forces a target opponent to stay in their current lane for a few seconds — they can't switch. | Low → High |
| **Speed Steal** | Siphons speed from the racer directly ahead and transfers it to you. Only works if someone is in front of you in the same lane. | Low → High |
| **EMP** | Knocks the held item out of every other racer's hand. They keep their charge meter progress but lose the drawn item. | Very Low → High |
| **Ghost** | Brief invincibility — you pass through hazards and other racers without collision for a few seconds. | Very Low → High |

Items are designed around the core constraint: the most impactful ones affect lane decisions (Oil Slick forces avoidance, Lane Lock restricts switching, Fake Boost Pad punishes greed) rather than just modifying speed directly.

---

### Collision with Consequence

Prototype collisions just nudge speeds. v2 makes contact feel like contact.

- **Sideswipe:** Two racers in the same lane collide when one catches the other. The trailing racer bounces to an adjacent lane if one is free; if not, they slow sharply.
- **Hazard hit:** Being struck by a hazard now has a brief recovery window — the racer moves at reduced speed and cannot switch lanes for a moment, making the hit feel punishing rather than just a speed tax.

---

### Field Size

v2 races 6 racers: the player plus 5 CPU opponents. The larger field makes the track feel alive — there are always racers ahead to slipstream, hazards to dodge, and position changes happening somewhere on screen. It also makes item targeting a real decision: do you hit the leader or protect yourself from the pack behind you?

CPU opponents are named and have distinct visual identities (see Racer Sprites).

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

Each item and hazard type gets a distinct look so the player can read the situation before reacting.

| Item / Hazard | Visual |
|---|---|
| Homing hazard | Pulsing, pointed shape that visibly rotates toward its target |
| Non-homing hazard | Flat, tumbling shape — clearly drifting, not tracking |
| Oil slick | Spreading iridescent patch on the lane surface |
| Fake boost pad | Nearly identical to a real boost pad — slightly duller color, barely perceptible |
| Shield | Soft glow around the protected racer |
| Lane lock | A brief flashing border on the locked racer indicating they can't switch |
| Speed steal | A visible beam or arc connecting thief to target while active |
| EMP | Shockwave ring expanding outward from the deployer |
| Ghost | Racer becomes semi-transparent; hazards visibly pass through them |

---

### Speed Feedback

- At high speed (boost active): slight motion blur on the racer, the trail lengthens, camera zooms out slightly to reveal more track ahead
- At low speed (hazard penalty): racer visual desaturates slightly, trail shortens, camera zooms in
- Returning to standard speed: smooth transition back to baseline on all three effects

---

### Slipstream Indicator

When the player is in a slipstream, a UI indicator appears near the racer showing the draft is active. It intensifies as the effect strengthens. No airflow animation on the track itself — the indicator is enough without adding visual noise to an already busy screen.

---

### Track Environments

Tracks are abstract and minimalist — no named environments or illustrated scenery. Each track is distinguished by its color palette and lane styling: different background color, lane line weight, and boost pad color treatment. The geometry of the track is the identity, not a theme.

Readability is never sacrificed for aesthetics. Hazards, boost pads, and racers always have the same contrast priority regardless of which track is active.

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

1. **EMP targeting:** Does EMP affect the player's own held item, or only opponents? Affecting yourself adds risk but could feel unfair.
2. **Ghost + sideswipe:** Does Ghost immunity extend to sideswipe collisions, or only hazards? Full immunity makes it very powerful; partial keeps lane switching risky even while ghosted.
3. **Lane Lock target selection:** Does the player choose who to lock, or does it auto-target the racer directly ahead? Choice is more satisfying; auto-target is faster to use under pressure.
