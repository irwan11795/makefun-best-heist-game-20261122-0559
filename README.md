# VELVET MIDNIGHT — a heist game

[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/irwan11795/makefun-best-heist-game-20261122-0559/rank.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/irwan11795/makefun-best-heist-game-20261122-0559/reward.svg)](https://make.fun/c/best-heist-game-20261122-0559)

You are **Wren**, gentleman thief of the velvet night. Three jobs, one crew
of one: a museum gallery, a casino vault, and a bank — each harder than the
last, each guarded by patrols with vision cones, sweeping security cameras,
and (in the bank) laser tripwires.

## How to play

- **WASD / arrow keys** — move. **Shift** — sneak (slow, but the alarm
  rises half as fast when you are spotted).
- **Hold E** beside a safe — lockpick it (watch the progress bar) and take
  the loot. Grab **all** the loot to unlock the green EXIT door.
- **Q** — throw a noisemaker (2 per job). Guards leave their patrol to
  investigate the ping — slip past while they are distracted.
- **P / Esc** — pause. **R** — restart the job. Mouse — click menu buttons.

## The alarm meter

Being inside a guard's vision cone or a camera's sweeping cone raises the
**ALARM** meter (bottom centre). Hide behind a crate or wall and it falls
again. At **100%** every guard chases you — and if one touches Wren, the
job is blown and restarts. Finish a job with peak alarm under 30% to earn
the **GHOST** stamp.

## The jobs

1. **The Gilded Gallery** — museum, 1 guard, 3 loot.
2. **The Velvet Vault** — casino, 2 guards, 2 cameras, 4 loot.
3. **The Iron Ledger** — bank, 3 guards, 2 cameras, laser tripwires, 5 loot.

All art is drawn in code (canvas 2D) and all sound is WebAudio
oscillators — no image or audio files, no libraries, no network requests.
Serve with `node serve.ts` and open http://localhost:8080.
