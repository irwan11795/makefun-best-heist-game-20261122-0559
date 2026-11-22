// VELVET MIDNIGHT — bootstrap, game loop and state machine.
// Screens: title → play → paused → result (job complete / caught / heist done).
// ?shot=start|play|end stages a scene for screenshots; ?level=N picks the
// job for the staged scene; ?auto=1 runs a deterministic autopilot that
// follows waypoints (loot, then exit) and waits out the alarm in cover.

import { LEVELS, levelReachable } from './levels.js';
import {
  makeGuard, makeCamera, updateGuard, updateCamera,
  guardSeesPlayer, cameraSeesPlayer, distractGuard, guardCatches,
} from './guards.js';
import { createRenderer, SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_OVER } from './render.js';
import { initInput, keys, moveVector, isSneaking, isHoldingInteract, consumePressed, consumeClick } from './input.js';
import { ensureAudio, playPickup, playClick, playLockTick, playThrow, playCaught, playWin, playAlarmBlip, setAlarmDrone } from './audio.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const autoMode = params.get('auto') === '1';
const shotLevel = Math.max(1, Math.min(3, parseInt(params.get('level') || '1', 10) || 1));

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const renderer = createRenderer(canvas);
initInput(canvas);

const RADIUS = 14;
const WALK_SPEED = 175;
const SNEAK_SPEED = 95;

const state = {
  screen: SCREEN_TITLE,
  levelIndex: 0,
  level: LEVELS[0],
  player: { x: 90, y: 90, angle: 0 },
  job: null, // { guards, cameras, lootTaken, lootGot, noisemakers, noises }
  alarm: 0,
  alarmPeak: 0,
  timeSec: 0,
  sneaking: false,
  lockProgress: 0,
  result: null, // { title, lines, prompt, ghost, next }
  laserCooldown: 0,
  autoTarget: 0,
  autoWait: 0,
};

function newJob(level) {
  return {
    guards: level.patrols.map((p, i) => makeGuard(p, i)),
    cameras: level.cameras.map(makeCamera),
    lootTaken: level.loot.map(() => false),
    lootGot: 0,
    noisemakers: 2,
    noises: [],
  };
}

function loadJob(index, opts) {
  state.levelIndex = index;
  state.level = LEVELS[index];
  state.player = { x: state.level.start.x, y: state.level.start.y, angle: 0 };
  state.job = newJob(state.level);
  state.alarm = 0;
  state.alarmPeak = 0;
  state.timeSec = 0;
  state.lockProgress = 0;
  state.result = null;
  state.laserCooldown = 0;
  state.autoTarget = 0;
  state.autoWait = 0;
  if (opts && opts.alarm) state.alarm = opts.alarm;
  if (opts && opts.player) { state.player.x = opts.player.x; state.player.y = opts.player.y; }
  if (opts && opts.lootGot) {
    for (let i = 0; i < opts.lootGot; i++) { state.job.lootTaken[i] = true; state.job.lootGot++; }
  }
}

function blockers() {
  return [...state.level.walls, ...state.level.crates];
}

function circleHitsRect(x, y, r) {
  const cx = Math.max(r.x, Math.min(x, r.x + r.w));
  const cy = Math.max(r.y, Math.min(y, r.y + r.h));
  return (x - cx) * (x - cx) + (y - cy) * (y - cy) < RADIUS * RADIUS;
}

function movePlayer(dx, dy) {
  const bs = blockers();
  const nx = state.player.x + dx;
  if (!bs.some((r) => circleHitsRect(nx, state.player.y, r))) state.player.x = nx;
  const ny = state.player.y + dy;
  if (!bs.some((r) => circleHitsRect(state.player.x, ny, r))) state.player.y = ny;
  state.player.x = Math.max(24 + RADIUS, Math.min(1256 - RADIUS, state.player.x));
  state.player.y = Math.max(24 + RADIUS, Math.min(696 - RADIUS, state.player.y));
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function nearestLoot() {
  let best = null;
  let bd = Infinity;
  state.level.loot.forEach((l, i) => {
    if (state.job.lootTaken[i]) return;
    const d = Math.hypot(l.x - state.player.x, l.y - state.player.y);
    if (d < bd) { bd = d; best = { loot: l, index: i, dist: d }; }
  });
  return best;
}

function fmtTime(t) {
  return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(Math.floor(t % 60)).padStart(2, '0');
}

function jobComplete() {
  const ghost = state.alarmPeak < 30;
  const last = state.levelIndex >= LEVELS.length - 1;
  playWin();
  const lines = [
    state.level.name + ' — cleared in ' + fmtTime(state.timeSec),
    'Loot  ' + state.job.lootGot + '/' + state.level.loot.length + '      Peak alarm  ' + Math.round(state.alarmPeak) + '%',
    ghost ? 'Not a single guard raised the alarm. A perfect ghost.' : 'Loud, but the vault is empty and you are gone.',
  ];
  if (last) {
    state.result = {
      title: 'HEIST COMPLETE',
      lines: [...lines, '', 'All three jobs done. Wren vanishes into the velvet night.'],
      prompt: 'Click or press Enter — back to the title',
      ghost: true, next: 'menu',
    };
  } else {
    state.result = {
      title: ghost ? 'GHOST — JOB CLEAR' : 'JOB CLEAR',
      lines,
      prompt: 'Click or press Enter — next job',
      ghost, next: 'next',
    };
  }
  state.screen = SCREEN_OVER;
  status.textContent = state.result.title + '. ' + lines.join(' ');
}

function jobCaught() {
  playCaught();
  setAlarmDrone(0);
  state.result = {
    title: 'CAUGHT!',
    lines: [
      state.level.name,
      'A guard got hands on Wren at ' + fmtTime(state.timeSec) + ' — loot ' + state.job.lootGot + '/' + state.level.loot.length,
      'The crew bails you out. The job restarts. Read the cones before you move.',
    ],
    prompt: 'Click or press R — retry the job',
    ghost: false, next: 'retry',
  };
  state.screen = SCREEN_OVER;
  status.textContent = 'Caught! Job restarts.';
}

function throwNoisemaker() {
  if (state.job.noisemakers <= 0) return;
  state.job.noisemakers--;
  const a = state.player.angle;
  const tx = state.player.x + Math.cos(a) * 130;
  const ty = state.player.y + Math.sin(a) * 130;
  state.job.noises.push({ x: tx, y: ty, ttl: 4 });
  for (const g of state.job.guards) distractGuard(g, tx, ty, 4);
  playThrow();
}

function update(dt) {
  state.timeSec += dt;
  state.laserCooldown = Math.max(0, state.laserCooldown - dt);

  // --- movement (player keys, or autopilot waypoints) ---
  let mv = moveVector();
  let holdingE = isHoldingInteract();
  if (autoMode) {
    const target = autoTargetPoint();
    // Flee only an imminent catch; otherwise wait out a warm alarm, and
    // do not walk up to a loot a guard is standing next to.
    let flee = null;
    let fd = Infinity;
    for (const g of state.job.guards) {
      const d = Math.hypot(g.x - state.player.x, g.y - state.player.y);
      if (d < fd) { fd = d; flee = g; }
    }
    let guardNearTarget = false;
    if (target) {
      for (const g of state.job.guards) {
        if (Math.hypot(g.x - target.x, g.y - target.y) < 150) guardNearTarget = true;
      }
    }
    if (flee && fd < 60) {
      const dx = state.player.x - flee.x;
      const dy = state.player.y - flee.y;
      const d = Math.hypot(dx, dy) || 1;
      mv = { x: dx / d, y: dy / d };
      state.autoWait = 0;
    } else if (state.autoWait > 0) {
      state.autoWait -= dt;
      mv = { x: 0, y: 0 };
    } else if (guardNearTarget || state.alarm > 25) {
      // Stand still: patrols move on and the alarm decays.
      mv = { x: 0, y: 0 };
      state.autoWait = 0.5;
    } else if (target) {
      const path = autoPathTo(target.x, target.y);
      const wp = path[0] || target;
      const dx = wp.x - state.player.x;
      const dy = wp.y - state.player.y;
      const d = Math.hypot(dx, dy);
      if (d > 10) mv = { x: dx / d, y: dy / d };
      else { mv = { x: 0, y: 0 }; path.shift(); }
    }
    const near = nearestLoot();
    holdingE = !!(near && near.dist < 46);
  }
  state.sneaking = isSneaking() || autoMode;
  const speed = (state.sneaking ? SNEAK_SPEED : WALK_SPEED) * dt;
  if (mv.x !== 0 || mv.y !== 0) {
    state.player.angle = Math.atan2(mv.y, mv.x);
    movePlayer(mv.x * speed, mv.y * speed);
  }

  // --- guards, cameras ---
  for (const g of state.job.guards) updateGuard(g, dt, state.player, blockers());
  for (const c of state.job.cameras) updateCamera(c, dt);
  for (const n of state.job.noises) n.ttl -= dt;
  state.job.noises = state.job.noises.filter((n) => n.ttl > 0);

  // --- detection: guard cones + camera cones raise the alarm ---
  const bs = blockers();
  let seen = false;
  let seenRate = 0;
  for (const g of state.job.guards) {
    if (guardSeesPlayer(g, state.player, bs)) { seen = true; seenRate = Math.max(seenRate, 45); }
  }
  for (const c of state.job.cameras) {
    if (cameraSeesPlayer(c, state.player, bs)) { seen = true; seenRate = Math.max(seenRate, 35); }
  }
  if (seen) {
    state.alarm += seenRate * (state.sneaking ? 0.5 : 1) * dt;
    if (Math.random() < dt * 2) playAlarmBlip();
  } else {
    state.alarm -= 18 * dt;
  }
  state.alarm = Math.max(0, Math.min(100, state.alarm));
  state.alarmPeak = Math.max(state.alarmPeak, state.alarm);
  setAlarmDrone(state.alarm);
  if (state.alarm >= 100) {
    for (const g of state.job.guards) {
      if (g.state !== 'chase') { g.state = 'chase'; g.chaseTimer = 4; }
    }
  }

  // --- lasers: tripping one spikes the alarm and sends guards hunting ---
  if (state.laserCooldown <= 0) {
    for (const l of state.level.lasers) {
      if (distToSegment(state.player.x, state.player.y, l.x1, l.y1, l.x2, l.y2) < 14) {
        state.alarm = Math.min(100, state.alarm + 45);
        state.laserCooldown = 1.2;
        for (const g of state.job.guards) { g.state = 'chase'; g.chaseTimer = 3; }
        playAlarmBlip();
        break;
      }
    }
  }

  // --- caught? ---
  for (const g of state.job.guards) {
    if (guardCatches(g, state.player)) { jobCaught(); return; }
  }

  // --- lockpick: hold E beside an unpicked safe ---
  const near = nearestLoot();
  if (near && near.dist < 46 && holdingE) {
    state.lockProgress += dt / 1.2;
    if (Math.random() < dt * 6) playLockTick();
    if (state.lockProgress >= 1) {
      state.job.lootTaken[near.index] = true;
      state.job.lootGot++;
      state.lockProgress = 0;
      playPickup();
      status.textContent = 'Loot taken: ' + near.loot.label + ' (' + state.job.lootGot + '/' + state.level.loot.length + ')';
    }
  } else {
    state.lockProgress = Math.max(0, state.lockProgress - dt * 2);
  }

  // --- noisemaker ---
  if (consumePressed('KeyQ')) throwNoisemaker();

  // --- exit: all loot, then walk into the green door ---
  const ex = state.level.exit;
  if (state.job.lootGot >= state.level.loot.length) {
    if (state.player.x > ex.x && state.player.x < ex.x + ex.w && state.player.y > ex.y && state.player.y < ex.y + ex.h) {
      jobComplete();
      return;
    }
  }
}

function autoTargetPoint() {
  const near = nearestLoot();
  if (near) return near.loot;
  const ex = state.level.exit;
  return { x: ex.x + ex.w / 2, y: ex.y + ex.h / 2 };
}

// Coarse-grid BFS path (20px cells) around walls/crates, so the autopilot
// goes around a wall through its gap instead of pushing against it.
let autoPath = [];
let autoPathKey = '';
let autoPathAt = 0;
function autoPathTo(tx, ty) {
  const cell = 20;
  const cols = 64;
  const rows = 36;
  const key = Math.floor(state.player.x / cell) + ',' + Math.floor(state.player.y / cell) + '>' + Math.floor(tx / cell) + ',' + Math.floor(ty / cell);
  const now = performance.now();
  if (key === autoPathKey && now - autoPathAt < 1000 && autoPath.length) return autoPath;
  autoPathKey = key;
  autoPathAt = now;
  const bs = blockers();
  const blocked = (cx, cy) => {
    const px = cx * cell + cell / 2;
    const py = cy * cell + cell / 2;
    // Inflate by the thief's radius so the path never hugs a wall corner
    // the circle cannot actually pass.
    return bs.some((r) => px > r.x - 16 && px < r.x + r.w + 16 && py > r.y - 16 && py < r.y + r.h + 16);
  };
  const sx = Math.floor(state.player.x / cell);
  const sy = Math.floor(state.player.y / cell);
  const gx = Math.floor(tx / cell);
  const gy = Math.floor(ty / cell);
  const prev = new Map();
  const q = [[sx, sy]];
  prev.set(sx + ',' + sy, null);
  while (q.length) {
    const [cx, cy] = q.shift();
    if (cx === gx && cy === gy) break;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 1 || ny < 1 || nx >= cols - 1 || ny >= rows - 1) continue;
      const k = nx + ',' + ny;
      // The goal cell is enterable even if inflation marks it blocked
      // (a loot safe can sit right beside a crate).
      if (prev.has(k) || (blocked(nx, ny) && !(nx === gx && ny === gy))) continue;
      prev.set(k, [cx, cy]);
      q.push([nx, ny]);
    }
  }
  const path = [];
  let cur = [gx, gy];
  if (!prev.has(gx + ',' + gy)) { autoPath = [{ x: tx, y: ty }]; return autoPath; }
  while (cur) {
    path.unshift({ x: cur[0] * cell + cell / 2, y: cur[1] * cell + cell / 2 });
    cur = prev.get(cur[0] + ',' + cur[1]);
  }
  autoPath = path;
  return autoPath;
}

// ---- shot staging (screenshots): fixed scenes, no randomness ----
function stageShot() {
  if (shot === 'start') {
    loadJob(0);
    state.screen = SCREEN_TITLE;
  } else if (shot === 'play') {
    loadJob(shotLevel - 1);
    state.screen = SCREEN_PLAY;
    // Rich staged frame: thief mid-room, a guard cone sweeping past,
    // cameras watching, loot on pedestals, alarm meter already warm.
    // &spot=2 stages a second, different Job 2 frame for the cover/2nd shot.
    const spots = [
      { x: 560, y: 300 }, { x: 520, y: 330 }, { x: 500, y: 300 },
    ];
    const spot2 = params.get('spot') === '2';
    state.player = spot2
      ? { x: 760, y: 480, angle: 2.4 }
      : { x: spots[shotLevel - 1].x, y: spots[shotLevel - 1].y, angle: -0.6 };
    state.alarm = spot2 ? 57 : 38;
    state.alarmPeak = state.alarm;
    state.job.lootTaken[0] = true;
    state.job.lootGot = 1;
    state.timeSec = spot2 ? 96 : 47;
  } else if (shot === 'end') {
    loadJob(0);
    state.job.lootTaken = state.level.loot.map(() => true);
    state.job.lootGot = state.level.loot.length;
    state.alarmPeak = 12;
    state.timeSec = 84;
    state.result = {
      title: 'GHOST — JOB CLEAR',
      lines: [
        'JOB 1 — THE GILDED GALLERY — cleared in 01:24',
        'Loot  3/3      Peak alarm  12%',
        'Not a single guard raised the alarm. A perfect ghost.',
      ],
      prompt: 'Click or press Enter — next job',
      ghost: true, next: 'next',
    };
    state.screen = SCREEN_OVER;
  }
  let painted = 0;
  const paint = () => {
    renderer.draw(state, state.screen, state.result);
    painted++;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  };
  requestAnimationFrame(paint);
}

// ---- live game ----
function runGame() {
  // ?job=N starts the live game at that job (used by the autopilot
  // play-test to exercise one job directly).
  const startJob = autoMode ? Math.max(1, Math.min(3, parseInt(params.get('job') || '1', 10) || 1)) : 1;
  loadJob(startJob - 1);
  if (autoMode) state.screen = SCREEN_PLAY;
  let last = performance.now();
  let acc = 0;
  const STEP = 1 / 60;

  function advanceResult() {
    if (!state.result) return;
    if (state.result.next === 'next') { loadJob(state.levelIndex + 1); state.screen = SCREEN_PLAY; }
    else if (state.result.next === 'retry') { loadJob(state.levelIndex); state.screen = SCREEN_PLAY; }
    else { loadJob(0); state.screen = SCREEN_TITLE; }
    playClick();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.25);
    last = now;
    ensureAudio();

    if (consumePressed('KeyP') || consumePressed('Escape')) {
      if (state.screen === SCREEN_PLAY) { state.screen = SCREEN_PAUSED; status.textContent = 'Paused.'; }
      else if (state.screen === SCREEN_PAUSED) { state.screen = SCREEN_PLAY; status.textContent = 'Playing.'; }
    }
    if (consumePressed('KeyR') && (state.screen === SCREEN_PLAY || state.screen === SCREEN_PAUSED)) {
      loadJob(state.levelIndex);
      state.screen = SCREEN_PLAY;
    }
    if (consumePressed('Enter') || consumePressed('Space')) {
      if (state.screen === SCREEN_TITLE) { loadJob(0); state.screen = SCREEN_PLAY; playClick(); }
      else if (state.screen === SCREEN_OVER) advanceResult();
      else if (state.screen === SCREEN_PAUSED) state.screen = SCREEN_PLAY;
    }
    const click = consumeClick();
    if (click) {
      if (state.screen === SCREEN_TITLE) { loadJob(0); state.screen = SCREEN_PLAY; playClick(); }
      else if (state.screen === SCREEN_OVER) advanceResult();
      else if (state.screen === SCREEN_PAUSED) state.screen = SCREEN_PLAY;
    }

    if (state.screen === SCREEN_PLAY) {
      acc += dt;
      while (acc >= STEP) { update(STEP); acc -= STEP; if (state.screen !== SCREEN_PLAY) { acc = 0; break; } }
    }
    renderer.draw(state, state.screen, state.result);
  }
  status.textContent = 'Velvet Midnight. Press Enter or click to start.';
  requestAnimationFrame(frame);
}

// Debug / test hook: the play-test reads this, never the DOM.
window.__velvet = {
  get screen() { return state.screen; },
  get job() { return state.levelIndex + 1; },
  get lootGot() { return state.job ? state.job.lootGot : 0; },
  get lootTotal() { return state.level.loot.length; },
  get alarm() { return state.alarm; },
  get alarmPeak() { return state.alarmPeak; },
  get timeSec() { return state.timeSec; },
  get resultTitle() { return state.result ? state.result.title : null; },
  get player() { return { x: Math.round(state.player.x), y: Math.round(state.player.y) }; },
  get autoInfo() {
    const t = autoMode ? autoTargetPoint() : null;
    return t ? { tx: Math.round(t.x), ty: Math.round(t.y), pathLen: autoPath.length, wp0: autoPath[0] || null, wait: +state.autoWait.toFixed(2) } : null;
  },
  reachable: LEVELS.map(levelReachable),
};

if (shot) stageShot();
else runGame();
