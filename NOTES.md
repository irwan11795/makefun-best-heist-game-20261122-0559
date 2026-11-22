# VELVET MIDNIGHT — design notes & play-test

## Design

Top-down stealth heist, canvas 2D, all art drawn in code, all sound WebAudio
oscillators. You are Wren, a gentleman thief. Three jobs of rising
difficulty; every job is a room you must cross while reading patrols and
sweeping camera cones before you move.

- **Detection is tiered**: guard cones (185px, ~70°) and camera cones
  (215px, sweeping) both raise the ALARM meter; sneaking halves the rise.
  Walls and crates block line of sight. At 100% every guard chases.
- **Tools at a cost**: lockpicking a safe takes 1.2s holding E beside it
  (exposed — time it between patrols); noisemakers are limited to 2 per
  job and pull guards off patrol to investigate the ping.
- **Fair catch**: a guard only catches Wren by touch, and chase speed is
  beatable if you break line of sight — the alarm decays when hidden.
- **Ghost incentive**: finish a job with peak alarm under 30% for the
  GHOST stamp on the result screen.

## Jobs

1. The Gilded Gallery (museum) — 1 guard, 3 loot.
2. The Velvet Vault (casino) — 2 guards, 2 cameras, 4 loot.
3. The Iron Ledger (bank) — 3 guards, 2 cameras, 2 laser tripwires, 5 loot.

## Controls

WASD/arrows move · Shift sneak · hold E lockpick · Q noisemaker · P/Esc
pause · R restart job · mouse click for menu buttons.

## Play-test (headless Chromium, local, deterministic autopilot `?auto=1`)

Full continuous run, all three jobs in one session (final code):

- Job 1: GHOST — JOB CLEAR, loot 3/3, peak alarm 0%, 38s.
- Job 2: JOB CLEAR, loot 4/4, peak alarm 95%, 82s.
- Job 3: HEIST COMPLETE, loot 5/5, peak alarm 52%, 78s.
- Total: ALL 3 JOBS COMPLETE, no catches. Autopilot uses BFS grid
  pathfinding (radius-inflated) + waits out warm alarms + flees close
  guards; it is a test harness only (`?auto=1`, `?job=N` to start at a
  job), the human game is fully keyboard/mouse playable.
- Reachability (BFS over walkable grid, all 3 jobs): all loot reachable,
  exit reachable.
- Screenshots: real renders of the game's own code via local Chromium
  (`?shot=play&level=N` / `?shot=end`), 1280×720 JPEG q85, each < 256 KiB.
- `main.ts` determinism: two runs with different MAKEFUN_OUTPUT_DIR
  compared by sha256 (see final report).
- Kit check: `node cli/makefun.mjs check` against the build dir
  (see final report).
