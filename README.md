# Tower: one-thumb workout logger

Live: https://vinzy0.github.io/workout-tower/

A PWA for logging home-gym workouts with scroll wheels (no typing) and a streak "tower":
one block per week you hit your goal.

## Run

```powershell
npm install
npm run dev
```

```powershell
npm test
```

Every push to `main` tests, builds and deploys to GitHub Pages (`.github/workflows/deploy.yml`).

## Layout

- `src/core/`: pure logic. `tower.ts` derives the whole tower (streak, shields, cracks, collapses)
  from finished sessions; it is never stored. Tests in `tower.test.ts`.
- `src/platform/`: everything platform-specific (storage, auth, haptics, share). See `NATIVE_MIGRATION.md`.
- `src/sync.ts`: Google Drive appDataFolder sync. See `GOOGLE_SETUP.md`.
- `src/screens/`: Home (tower), Workout, Presets, PresetEditor, Settings, PastTowers.

## Design

Follows `DESIGN.md` (Pastel Blocks). One intentional exception: the tower's material tiers
(wood, stone, iron, gold, diamond) use textured, non-pastel colors and a solid "depth" face,
because the spec asks the tower to feel like a game. They are game art, not UI chrome.
