# Game Plan: SKYFRONT

## Product boundary

**SKYFRONT** is an original, touch-first battle-royale vertical slice for landscape mobile browsers. It takes inspiration only from broad genre conventions—drop-in combat, a contracting safe zone, loot, and last-player-standing pacing—and does not reproduce another title's protected names, artwork, maps, characters, sounds, or interface assets.

The existing repository is a React web application rather than a native mobile project. The implementation therefore targets an installable, full-screen mobile web experience with a 16:9 landscape play surface. Native app packaging, online matchmaking, voice chat, anti-cheat, commerce, and original-title content are intentionally outside this build.

## Risk Tasks

### 1. Full-screen Babylon scene inside React

- **Why isolated:** React 19 development mounting and existing application layout can create duplicate render loops, a zero-size canvas, or unwanted dashboard chrome.
- **Approach:** Render the game outside the existing authenticated dashboard shell. Initialize one Babylon engine per mounted canvas, bind resize handling, and cleanly dispose the render loop, scene resources, and input listeners on unmount.
- **Verify:** The game route fills the viewport without a sidebar; navigation away and back leaves no duplicate canvas or console error; resizing retains the visible scene.

### 2. Touch movement, aiming, and firing

- **Why isolated:** Browser pointer handling must distinguish touch gestures from the 3D canvas and prevent scroll/selection on a handset.
- **Approach:** Use a semantic `setMoveInput(x, y)` API backed by a virtual joystick, plus explicit fire/aim/jump UI actions. Provide keyboard equivalents for desktop verification without coupling gameplay logic to DOM events.
- **Verify:** Moving the virtual joystick changes the player direction smoothly; releasing it stops movement; fire produces visible projectiles; the page does not scroll while the controls are pressed.

### 3. Contracting zone and combat state transitions

- **Why isolated:** Zone scale, player distance checks, projectile hit testing, and win/loss transitions must remain coherent in a continuous render loop.
- **Approach:** Maintain explicit `lobby`, `active`, `victory`, and `defeat` states. Shrink a visible energy ring over the match timer, apply periodic out-of-zone damage, use bounded projectile lifetimes, and update enemies through compact steering behavior.
- **Verify:** The zone visibly contracts over time; leaving it drains health; hit enemies are removed and the elimination counter updates; removing all opponents ends the match; zero player health shows a defeat state.

## Main Build

Build a full-screen landscape game shell containing a launch lobby, a third-person playable arena, a compact tactical HUD, a minimap-style zone indicator, weapon/ammo status, an inventory slot, and touch controls. The arena uses a warm grassland palette, a cyan energy ring, cover barriers, a watchtower silhouette, supply crates, two hostile training bots, and player projectiles. The player can move, rotate/aim, fire, collect one supply crate for ammunition, survive the shrinking zone, and eliminate bots.

- **Assets:**
  - `reference-battlefield` visual benchmark, 2560×1440 px, used to anchor composition and HUD hierarchy.
  - `skyfront-ground` 2 m repeatable stylized dry-grass terrain texture.
  - `skyfront-emblem` 256×256 px compact teal triangular player marker for the HUD/lobby.
- **Verify:**
  - Movement direction follows joystick or keyboard input and stops when input ends.
  - Fire consumes ammunition, renders projectiles, and enemy hits update state.
  - Enemies, crate, barriers, watchtower, blue zone, and HUD are all visible together.
  - Text and controls remain readable without overlap at a 16:9 mobile landscape viewport.
  - Generated visual assets appear in the lobby/HUD and no external copyrighted game asset is used.
  - No missing texture, fallback material, visual clipping, or console error is present during a match.
  - The final screen is consistent with the reference composition: warm terrain, cyan safety ring, elevated third-person camera, sparse tactical cover, and clear control hierarchy.

## Acceptance flow

1. Open the app and select **DEPLOY** from the lobby.
2. Move with the left virtual joystick or WASD.
3. Hold/click **FIRE** or press Space to shoot; hit both training bots.
4. Watch the cyan safe zone contract and return inside it if health begins dropping.
5. Reach **EXTRACTION COMPLETE** after the second elimination, or restart after defeat.

## Deferred system work

The result is a functional single-player prototype, not a networked recreation of a commercial game. A production mobile title would separately require original art production, authoritative multiplayer servers, matchmaking, synchronization, persistence, device QA, accessibility work, monetization review, telemetry, moderation, and legal clearance.
