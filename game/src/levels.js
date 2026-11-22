// VELVET MIDNIGHT — level definitions.
// One level = one job. Each job is a room plan: walls, crates (cover that
// blocks sight), guard patrol routes, sweeping cameras, laser tripwires,
// loot safes, the exit door and where Wren starts. All coordinates are in
// the 1280x720 playfield; walls are axis-aligned rectangles.

export const PLAY_W = 1280;
export const PLAY_H = 720;

function borderWalls() {
  return [
    { x: 0, y: 0, w: 1280, h: 24 },
    { x: 0, y: 696, w: 1280, h: 24 },
    { x: 0, y: 0, w: 24, h: 720 },
    { x: 1256, y: 0, w: 24, h: 720 },
  ];
}

// Job 1 — The Gilded Gallery (museum). One guard, three loot safes.
const JOB1 = {
  id: 1,
  name: 'JOB 1 — THE GILDED GALLERY',
  sub: 'Museum heist · 1 guard · 3 loot',
  start: { x: 90, y: 90 },
  exit: { x: 1150, y: 600, w: 70, h: 60 },
  walls: [
    ...borderWalls(),
    { x: 300, y: 24, w: 24, h: 220 },
    { x: 300, y: 420, w: 24, h: 276 },
    { x: 640, y: 24, w: 24, h: 180 },
    { x: 640, y: 380, w: 24, h: 316 },
    { x: 950, y: 200, w: 24, h: 496 },
  ],
  crates: [
    { x: 420, y: 300, w: 90, h: 70 },
    { x: 760, y: 520, w: 100, h: 70 },
    { x: 1080, y: 120, w: 90, h: 70 },
  ],
  patrols: [
    { waypoints: [{ x: 480, y: 560 }, { x: 480, y: 120 }, { x: 880, y: 120 }, { x: 880, y: 560 }], speed: 62 },
  ],
  cameras: [],
  lasers: [],
  loot: [
    { x: 180, y: 620, kind: 'painting', label: 'Sunset Portrait' },
    { x: 820, y: 90, kind: 'vase', label: 'Jade Vase' },
    { x: 1180, y: 320, kind: 'gem', label: 'Star Sapphire' },
  ],
};

// Job 2 — The Velvet Vault (casino). Two guards, two sweeping cameras.
const JOB2 = {
  id: 2,
  name: 'JOB 2 — THE VELVET VAULT',
  sub: 'Casino heist · 2 guards · 2 cameras · 4 loot',
  start: { x: 90, y: 620 },
  exit: { x: 1150, y: 90, w: 70, h: 60 },
  walls: [
    ...borderWalls(),
    { x: 300, y: 24, w: 24, h: 300 },
    { x: 300, y: 480, w: 24, h: 216 },
    { x: 620, y: 200, w: 24, h: 496 },
    { x: 620, y: 24, w: 24, h: 60 },
    { x: 940, y: 24, w: 24, h: 260 },
    { x: 940, y: 440, w: 24, h: 256 },
  ],
  crates: [
    { x: 420, y: 120, w: 90, h: 70 },
    { x: 420, y: 540, w: 90, h: 70 },
    { x: 760, y: 300, w: 100, h: 70 },
    { x: 1060, y: 520, w: 90, h: 70 },
  ],
  patrols: [
    { waypoints: [{ x: 470, y: 620 }, { x: 470, y: 100 }, { x: 560, y: 100 }, { x: 560, y: 620 }], speed: 72 },
    { waypoints: [{ x: 800, y: 100 }, { x: 800, y: 620 }, { x: 1100, y: 620 }, { x: 1100, y: 100 }], speed: 72 },
  ],
  cameras: [
    { x: 324, y: 360, baseAngle: 0, sweep: 0.9, speed: 0.7 },
    { x: 940, y: 360, baseAngle: Math.PI, sweep: 0.9, speed: 0.55 },
  ],
  lasers: [],
  loot: [
    { x: 180, y: 100, kind: 'chips', label: 'Chip Case' },
    { x: 480, y: 360, kind: 'gem', label: 'Roulette Ruby' },
    { x: 820, y: 620, kind: 'gold', label: 'Gold Bars' },
    { x: 1180, y: 360, kind: 'painting', label: 'High Roller Art' },
  ],
};

// Job 3 — The Iron Ledger (bank). Three guards, two cameras, two lasers.
const JOB3 = {
  id: 3,
  name: 'JOB 3 — THE IRON LEDGER',
  sub: 'Bank heist · 3 guards · 2 cameras · lasers · 5 loot',
  start: { x: 90, y: 90 },
  exit: { x: 1150, y: 600, w: 70, h: 60 },
  walls: [
    ...borderWalls(),
    { x: 280, y: 24, w: 24, h: 240 },
    { x: 280, y: 420, w: 24, h: 276 },
    { x: 560, y: 240, w: 24, h: 456 },
    { x: 560, y: 24, w: 24, h: 90 },
    { x: 840, y: 24, w: 24, h: 300 },
    { x: 840, y: 480, w: 24, h: 216 },
    { x: 1060, y: 240, w: 24, h: 240 },
  ],
  crates: [
    { x: 380, y: 120, w: 90, h: 70 },
    { x: 380, y: 540, w: 90, h: 70 },
    { x: 660, y: 360, w: 100, h: 70 },
    { x: 960, y: 120, w: 90, h: 70 },
    { x: 960, y: 560, w: 90, h: 70 },
  ],
  patrols: [
    { waypoints: [{ x: 420, y: 620 }, { x: 420, y: 100 }, { x: 500, y: 100 }, { x: 500, y: 620 }], speed: 80 },
    { waypoints: [{ x: 700, y: 100 }, { x: 700, y: 620 }, { x: 780, y: 620 }, { x: 780, y: 100 }], speed: 80 },
    { waypoints: [{ x: 950, y: 620 }, { x: 950, y: 300 }, { x: 1180, y: 300 }, { x: 1180, y: 620 }], speed: 80 },
  ],
  cameras: [
    { x: 304, y: 330, baseAngle: 0, sweep: 1.0, speed: 0.8 },
    { x: 840, y: 390, baseAngle: Math.PI, sweep: 1.0, speed: 0.65 },
  ],
  lasers: [
    { x1: 584, y1: 240, x2: 584, y2: 420 },
    { x1: 1084, y1: 240, x2: 1084, y2: 480 },
  ],
  loot: [
    { x: 180, y: 620, kind: 'gold', label: 'Bullion' },
    { x: 440, y: 360, kind: 'gem', label: 'Crown Diamond' },
    { x: 720, y: 90, kind: 'chips', label: 'Bond Certificates' },
    { x: 940, y: 620, kind: 'vase', label: 'Mint Plates' },
    { x: 1180, y: 120, kind: 'painting', label: 'Ledger Masterpiece' },
  ],
};

export const LEVELS = [JOB1, JOB2, JOB3];

// Breadth-first reachability check over a coarse grid: every loot item and
// the exit must be reachable from the start without crossing a wall/crate.
// Used by the play-test harness and by main.js at load time.
export function levelReachable(level) {
  const cell = 20;
  const cols = Math.floor(PLAY_W / cell);
  const rows = Math.floor(PLAY_H / cell);
  const blocked = (cx, cy) => {
    const px = cx * cell + cell / 2;
    const py = cy * cell + cell / 2;
    for (const r of [...level.walls, ...level.crates]) {
      if (px > r.x + 4 && px < r.x + r.w - 4 && py > r.y + 4 && py < r.y + r.h - 4) return true;
    }
    return false;
  };
  const seen = new Set();
  const q = [[Math.floor(level.start.x / cell), Math.floor(level.start.y / cell)]];
  seen.add(q[0].join(','));
  while (q.length) {
    const [cx, cy] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      const k = nx + ',' + ny;
      if (seen.has(k) || blocked(nx, ny)) continue;
      seen.add(k);
      q.push([nx, ny]);
    }
  }
  const near = (p) => {
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        if (seen.has((Math.floor(p.x / cell) + dx) + ',' + (Math.floor(p.y / cell) + dy))) return true;
      }
    }
    return false;
  };
  const lootOk = level.loot.map((l) => near(l));
  const exitOk = near({ x: level.exit.x + level.exit.w / 2, y: level.exit.y + level.exit.h / 2 });
  return { lootOk, exitOk, allOk: exitOk && lootOk.every(Boolean) };
}
