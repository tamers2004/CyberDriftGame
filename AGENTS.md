# AGENTS.md

## Project
Cyber Drift — a browser-only, AAA-style cyberpunk arcade racing game (portfolio
project). Full feature design spec lives in `plan.md`; read it before adding features.

Hard constraints:
- Frontend only. No backend, no server state.
- All persistence is `localStorage` under key `cyberdrift.save.v1` (see `src/utils/save.ts`).
- Target 60 FPS on average hardware.

## Commands
- `npm run dev` — Vite dev server (port 5173).
- `npm run build` — `tsc -b && vite build` (typecheck then bundle).
- `npm run typecheck` — `tsc -b` only.
- `npm run lint` — ESLint (flat config). `npm run format` — Prettier.

## Architecture
- React 19 + Vite + TypeScript, Tailwind CSS, Zustand (`src/store/useGame.ts`).
- 3D via `@react-three/fiber` + `three` + `@react-three/postprocessing`.
- Navigation is `react-router-dom` (routes in `src/App.tsx`); the zustand store
  holds save data + live race stats only.
- Game flow: MainMenu → Garage → Race → Results.

### Deviations from plan.md (verify before "fixing")
- **Physics**: custom arcade vehicle model in `src/game/physics/vehicle.ts`, NOT
  Rapier. Velocity has world-space inertia; heading rotates independently; grip
  pulls lateral velocity toward the heading. Tuned via module constants
  (`SLIP`, `GRIP_STIFF`, `TURN_SCALE`, `DRIFT_DEG`).
- **Audio**: WebAudio-synth engine in `src/game/audio/AudioEngine.ts`, NOT Howler
  (no audio asset files exist). Must be `audio.init()`-ed from a user gesture.
- **Animation**: rAF/CSS, NOT GSAP/React Spring (not installed).
- `@react-three/drei` and `howler` were deliberately uninstalled; do not re-add.

## Key files / systems
- `src/game/world/track.ts` — closed-loop track: 900 sampled waypoints, lap
  counting via `cumRaw` continuous-distance integration (`src/game/race/raceManager.ts`).
- `src/game/world/city.ts` — seeded (deterministic) procedural city; also exports
  building AABBs used for player collision push-out.
- `src/game/race/raceManager.ts` — single per-frame tick for player + AI, drift
  scoring, nitro recharge, lap/position. `raceVisuals.cars` is mutated per frame
  for the minimap; don't render React state from it.
- `src/game/player/CarModel.tsx` — car visuals; reads a `Vehicle` every frame
  (positions/rotations are set imperatively in `useFrame`, never via props).

## Gotchas
- `Vehicle.update()` and race state are per-frame imperative; do NOT round-trip
  them through React state. HUD/minimap read them via `useFrame`/rAF refs.
- Store `updateRace` is throttled to ~10 Hz inside `RaceManager` — keep it that
  way to avoid re-rendering the HUD every frame.
- `driftAngle` is in radians; drift thresholds use `DRIFT_DEG`.
- The race finishes after 3 laps (see `LAPS`); result is written via
  `finishRace()` and routes to `/results`.
- Don't rely on `performance.now()` for gameplay math inside tests/sims — it runs
  in real time and makes sims finish instantly (browser behavior is correct).
- AudioContext requires a user gesture; the one-time listener lives in `src/App.tsx`.
