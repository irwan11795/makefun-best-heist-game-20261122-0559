// VELVET MIDNIGHT — guard patrol, vision cones, detection and chase.
// Guards walk waypoints, pause at each end, and look along their heading.
// A guard (or camera) sees the thief only inside its cone, inside range,
// and with a clear line of sight — walls and crates block vision.

export const GUARD_VIEW_DIST = 185;
export const GUARD_HALF_ANGLE = 0.62; // ~35 degrees each side
export const CAM_VIEW_DIST = 215;
export const CAM_HALF_ANGLE = 0.5;

export function makeGuard(patrol, index) {
  const wp = patrol.waypoints[0];
  return {
    id: index,
    x: wp.x,
    y: wp.y,
    angle: 0,
    wpIndex: 1 % patrol.waypoints.length,
    pause: 0,
    speed: patrol.speed,
    waypoints: patrol.waypoints,
    state: 'patrol', // patrol | investigate | chase
    investigate: null,
    investigateTimer: 0,
    chaseTimer: 0,
  };
}

export function makeCamera(def) {
  return { x: def.x, y: def.y, baseAngle: def.baseAngle, sweep: def.sweep, speed: def.speed, t: Math.random() * 6, angle: def.baseAngle };
}

// Segment (x1,y1)-(x2,y2) vs rectangle intersection (slab test).
export function segmentHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tmin = 0;
  let tmax = 1;
  for (const [o, d, lo, hi] of [[x1, dx, r.x, r.x + r.w], [y1, dy, r.y, r.y + r.h]]) {
    if (Math.abs(d) < 1e-9) {
      if (o < lo || o > hi) return false;
    } else {
      let t1 = (lo - o) / d;
      let t2 = (hi - o) / d;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return false;
    }
  }
  return true;
}

export function lineOfSight(x1, y1, x2, y2, blockers) {
  for (const r of blockers) {
    if (segmentHitsRect(x1, y1, x2, y2, r)) return false;
  }
  return true;
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// True when the watcher at (x,y) facing `angle` can see the player.
export function watcherSees(x, y, angle, dist, halfAngle, player, blockers) {
  const dx = player.x - x;
  const dy = player.y - y;
  const d = Math.hypot(dx, dy);
  if (d > dist) return false;
  if (d > 26 && Math.abs(angleDiff(Math.atan2(dy, dx), angle)) > halfAngle) return false;
  return lineOfSight(x, y, player.x, player.y, blockers);
}

export function updateGuard(g, dt, player, blockers) {
  if (g.state === 'chase') {
    g.chaseTimer -= dt;
    const dx = player.x - g.x;
    const dy = player.y - g.y;
    const d = Math.hypot(dx, dy) || 1;
    g.angle = Math.atan2(dy, dx);
    const sp = g.speed * 1.85;
    g.x += (dx / d) * sp * dt;
    g.y += (dy / d) * sp * dt;
    if (g.chaseTimer <= 0) g.state = 'patrol';
    return;
  }
  if (g.state === 'investigate' && g.investigate) {
    const dx = g.investigate.x - g.x;
    const dy = g.investigate.y - g.y;
    const d = Math.hypot(dx, dy);
    if (d > 12) {
      g.angle = Math.atan2(dy, dx);
      g.x += (dx / d) * g.speed * 1.25 * dt;
      g.y += (dy / d) * g.speed * 1.25 * dt;
    } else {
      g.investigateTimer -= dt;
      g.angle += dt * 1.5;
      if (g.investigateTimer <= 0) { g.state = 'patrol'; g.investigate = null; }
    }
    return;
  }
  // Patrol: walk to next waypoint, pause briefly at each one.
  if (g.pause > 0) {
    g.pause -= dt;
    return;
  }
  const target = g.waypoints[g.wpIndex];
  const dx = target.x - g.x;
  const dy = target.y - g.y;
  const d = Math.hypot(dx, dy);
  if (d < 8) {
    g.wpIndex = (g.wpIndex + 1) % g.waypoints.length;
    g.pause = 1.0;
    return;
  }
  g.angle = Math.atan2(dy, dx);
  g.x += (dx / d) * g.speed * dt;
  g.y += (dy / d) * g.speed * dt;
}

export function updateCamera(cam, dt) {
  cam.t += dt;
  cam.angle = cam.baseAngle + Math.sin(cam.t * cam.speed) * cam.sweep;
}

export function guardSeesPlayer(g, player, blockers) {
  return watcherSees(g.x, g.y, g.angle, GUARD_VIEW_DIST, GUARD_HALF_ANGLE, player, blockers);
}

export function cameraSeesPlayer(cam, player, blockers) {
  return watcherSees(cam.x, cam.y, cam.angle, CAM_VIEW_DIST, CAM_HALF_ANGLE, player, blockers);
}

// Send a guard to investigate a noise at (x, y) for `seconds`.
export function distractGuard(g, x, y, seconds) {
  if (g.state === 'chase') return;
  g.state = 'investigate';
  g.investigate = { x, y };
  g.investigateTimer = seconds;
}

// A guard in chase state that touches the thief catches them.
export function guardCatches(g, player) {
  return Math.hypot(g.x - player.x, g.y - player.y) < 24;
}
