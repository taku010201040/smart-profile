# SKYFRONT Structure

The project retains the existing React/Vite host but replaces the dashboard route with a full-screen game route. React owns the launch screen, HUD, touch controls, and lifecycle of the canvas. Babylon owns the 3D scene, render loop, transforms, cameras, lights, terrain, meshes, and collision-oriented gameplay visualization. Core gameplay remains in plain TypeScript under `client/src/game/`.

| Module | Responsibility |
|---|---|
| `client/src/App.tsx` | Routes directly to the game and bypasses the dashboard shell. |
| `client/src/pages/Skyfront.tsx` | Maintains the lobby/game/result presentation states, renders the HUD and touch controls, and forwards semantic actions to the game handle. |
| `client/src/components/GameCanvas.tsx` | Creates exactly one Babylon engine, creates the scene asynchronously, keeps the canvas resized, and disposes resources on unmount. |
| `client/src/game/types.ts` | Defines the game state snapshot and the public `GameHandle` contract between UI and gameplay. |
| `client/src/game/scene.ts` | Exports `createGameScene(engine, canvas)`, owns the arena, player, bots, zone, projectiles, match loop, camera, generated-asset textures, and cleanup. |
| `client/src/pages/skyfront.css` | Defines the landscape mobile frame, translucent tactical UI, virtual joystick, action buttons, accessibility focus states, and reduced-motion handling. |

## Runtime state

`Skyfront` UI state is explicit: `lobby`, `active`, `victory`, and `defeat`. The scene emits a compact `GameSnapshot` at a controlled cadence, allowing React to update health, armor, ammo, zone time, remaining enemies, combat log, and ending state without owning the render loop.

## Input contract

The UI only sends semantic actions: `setMoveInput`, `setAimInput`, `fire`, `jump`, `startMatch`, and `restart`. Desktop keys exist as verification fallbacks: WASD for movement, arrows or Q/E for aim, Space for fire, and R for restart. The game scene never queries React state or DOM buttons directly.

## Asset hints

The arena uses the generated dry-grass texture on a 72 m square ground plane. The reference image remains a visual benchmark rather than a 3D texture. The teal emblem is presented in the launch HUD. Cover blocks, crates, trees, watchtower silhouette, bots, health bars, bullets, and zone geometry are created procedurally at runtime using Babylon primitives and simple materials.
