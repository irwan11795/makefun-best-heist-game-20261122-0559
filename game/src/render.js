// VELVET MIDNIGHT — drawing only: room, cones, cameras, lasers, loot,
// the thief, and the HUD with its alarm meter. Canvas 2D, no image assets.
// The 1280x720 playfield is scaled to fit the window and centred.

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

import { GUARD_VIEW_DIST, CAM_VIEW_DIST } from './guards.js';

const FONT = 'bold 16px Georgia, serif';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(window.innerWidth * ratio);
    canvas.height = Math.round(window.innerHeight * ratio);
    view.scale = Math.min(canvas.width / 1280, canvas.height / 720);
    view.x = (canvas.width - 1280 * view.scale) / 2;
    view.y = (canvas.height - 720 * view.scale) / 2;
  }
  resize();
  window.addEventListener('resize', resize);

  function text(value, x, y, size, color, align, font) {
    ctx.font = (font || 'bold ') + size + 'px Georgia, serif';
    ctx.fillStyle = color;
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(value, x, y);
  }

  function cone(x, y, angle, dist, half, fill) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, dist, angle - half, angle + half);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function drawRoom(level, jobState) {
    // Floor: dark velvet with a subtle checker + carpet runner.
    ctx.fillStyle = '#171226';
    ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = '#1c1630';
    for (let i = 0; i < 16; i++) {
      for (let j = 0; j < 9; j++) {
        if ((i + j) % 2 === 0) ctx.fillRect(i * 80, j * 80, 80, 80);
      }
    }
    // Carpet runner down the middle.
    ctx.fillStyle = 'rgba(120, 20, 40, 0.35)';
    ctx.fillRect(24, 330, 1232, 60);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 330, 1232, 60);

    // Walls.
    for (const w of level.walls) {
      ctx.fillStyle = '#3a2f5e';
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = '#57468a';
      ctx.fillRect(w.x, w.y, w.w, 4);
    }
    // Crates / cover.
    for (const c of level.crates) {
      ctx.fillStyle = '#6b4a1f';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = '#a87c3a';
      ctx.lineWidth = 3;
      ctx.strokeRect(c.x + 3, c.y + 3, c.w - 6, c.h - 6);
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.x + c.w, c.y + c.h);
      ctx.moveTo(c.x + c.w, c.y);
      ctx.lineTo(c.x, c.y + c.h);
      ctx.stroke();
    }
    // Lasers.
    for (const l of level.lasers) {
      const on = Math.floor(performance.now() / 400) % 2 === 0;
      ctx.strokeStyle = on ? '#ff2a2a' : '#ff7070';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 6]);
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.lineTo(l.x2, l.y2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ff2a2a';
      ctx.beginPath(); ctx.arc(l.x1, l.y1, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(l.x2, l.y2, 5, 0, Math.PI * 2); ctx.fill();
    }
    // Exit door.
    const ex = level.exit;
    const open = jobState.lootGot >= level.loot.length;
    ctx.fillStyle = open ? '#2fae5f' : '#7a1f2b';
    ctx.fillRect(ex.x, ex.y, ex.w, ex.h);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;
    ctx.strokeRect(ex.x, ex.y, ex.w, ex.h);
    text(open ? 'EXIT' : 'LOCKED', ex.x + ex.w / 2, ex.y + ex.h / 2 + 6, 15, '#fff', 'center');
    if (!open) text('GET ALL LOOT', ex.x + ex.w / 2, ex.y - 8, 12, '#ffb3b3', 'center');
  }

  function drawLoot(level, jobState) {
    level.loot.forEach((loot, i) => {
      if (jobState.lootTaken[i]) return;
      const pulse = 1 + Math.sin(performance.now() / 300 + i) * 0.12;
      ctx.save();
      ctx.translate(loot.x, loot.y);
      ctx.scale(pulse, pulse);
      // Gold safe / pedestal.
      ctx.fillStyle = '#2a2118';
      ctx.fillRect(-16, -12, 32, 26);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2;
      ctx.strokeRect(-16, -12, 32, 26);
      ctx.fillStyle = '#ffd94a';
      ctx.beginPath();
      ctx.moveTo(0, -26); ctx.lineTo(10, -10); ctx.lineTo(0, 2); ctx.lineTo(-10, -10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      text('◆ ' + loot.label, loot.x, loot.y + 34, 12, '#ffd94a', 'center');
    });
  }

  function drawWatchers(jobState) {
    // Camera cones first (under guards), then guard cones.
    for (const cam of jobState.cameras) {
      cone(cam.x, cam.y, cam.angle, CAM_VIEW_DIST, 0.5, 'rgba(255, 80, 80, 0.16)');
      ctx.fillStyle = '#222';
      ctx.beginPath(); ctx.arc(cam.x, cam.y, 11, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ff5050';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cam.x, cam.y, 11, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#ff5050';
      ctx.beginPath(); ctx.arc(cam.x, cam.y, 4, 0, Math.PI * 2); ctx.fill();
      text('CAM', cam.x, cam.y - 16, 10, '#ff8080', 'center');
    }
    for (const g of jobState.guards) {
      const chasing = g.state === 'chase';
      cone(g.x, g.y, g.angle, GUARD_VIEW_DIST, 0.62, chasing ? 'rgba(255, 40, 40, 0.30)' : 'rgba(255, 220, 90, 0.20)');
      // Guard body: navy uniform + cap.
      ctx.fillStyle = chasing ? '#a31212' : '#1f3a6e';
      ctx.beginPath(); ctx.arc(g.x, g.y, 15, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(g.x, g.y, 15, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(g.x - 10, g.y - 24, 20, 6);
      // Facing tick.
      ctx.strokeStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(g.x, g.y);
      ctx.lineTo(g.x + Math.cos(g.angle) * 22, g.y + Math.sin(g.angle) * 22);
      ctx.stroke();
      if (g.state === 'investigate') text('?', g.x, g.y - 30, 20, '#fff', 'center');
      if (chasing) text('!', g.x, g.y - 30, 22, '#ff4040', 'center');
    }
    // Noisemaker pings.
    for (const n of jobState.noises) {
      ctx.strokeStyle = '#7ee0ff';
      ctx.lineWidth = 2;
      const r = 12 + ((performance.now() / 40) % 24);
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#7ee0ff';
      ctx.beginPath(); ctx.arc(n.x, n.y, 6, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawPlayer(p, sneaking, lockProgress) {
    ctx.save();
    ctx.translate(p.x, p.y);
    // Shadow.
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.ellipse(0, 12, 14, 6, 0, 0, Math.PI * 2); ctx.fill();
    // Hooded thief: velvet cloak + mask.
    ctx.fillStyle = '#7b2fbe';
    ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(0, -3, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-3, -4, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3, -4, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    text('WREN', p.x, p.y - 22, 11, '#e8c8ff', 'center');
    if (sneaking) text('sneaking…', p.x, p.y + 30, 11, '#b9a8ff', 'center');
    if (lockProgress > 0) {
      ctx.fillStyle = '#000';
      ctx.fillRect(p.x - 30, p.y - 44, 60, 8);
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(p.x - 30, p.y - 44, 60 * lockProgress, 8);
      text('LOCKPICK…', p.x, p.y - 50, 11, '#ffd94a', 'center');
    }
  }

  function drawHud(level, jobState, alarm, timeSec, totalLoot) {
    // Top bar.
    ctx.fillStyle = 'rgba(10, 8, 18, 0.85)';
    ctx.fillRect(0, 0, 1280, 56);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 56); ctx.lineTo(1280, 56); ctx.stroke();
    text('VELVET MIDNIGHT', 20, 36, 24, '#d4af37', 'left');
    text(level.name, 330, 36, 18, '#fff', 'left');
    text('LOOT  ' + jobState.lootGot + '/' + level.loot.length, 800, 36, 18, '#ffd94a', 'left');
    text('NOISEMAKER ×' + jobState.noisemakers, 950, 36, 15, '#7ee0ff', 'left');
    const mm = String(Math.floor(timeSec / 60)).padStart(2, '0');
    const ss = String(Math.floor(timeSec % 60)).padStart(2, '0');
    text(mm + ':' + ss, 1150, 36, 18, '#fff', 'left');
    // ALARM METER — big, unmissable, bottom centre.
    const bw = 420;
    const bx = (1280 - bw) / 2;
    const by = 668;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(bx - 8, by - 8, bw + 16, 40);
    ctx.fillStyle = '#222';
    ctx.fillRect(bx, by, bw, 24);
    const frac = Math.max(0, Math.min(1, alarm / 100));
    const col = alarm < 40 ? '#2fae5f' : alarm < 75 ? '#ffb020' : '#ff2a2a';
    ctx.fillStyle = col;
    ctx.fillRect(bx, by, bw * frac, 24);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, 24);
    text('ALARM', bx - 10, by + 18, 16, '#fff', 'right');
    text(Math.round(alarm) + '%', bx + bw + 10, by + 18, 16, col, 'left');
    if (alarm >= 100) text('!! CHASE !!', bx + bw / 2, by - 14, 16, '#ff4040', 'center');
    // Controls hint, bottom left.
    text('WASD move · Shift sneak · E lockpick · Q noisemaker · P pause · R restart', 20, 706, 13, '#9a8fb8', 'left');
  }

  function drawPanel(title, lines, prompt, accent) {
    ctx.fillStyle = 'rgba(8, 6, 14, 0.82)';
    ctx.fillRect(0, 0, 1280, 720);
    const w = 680;
    const h = 150 + lines.length * 34;
    const x = (1280 - w) / 2;
    const y = (720 - h) / 2;
    ctx.fillStyle = '#1d1533';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = accent || '#d4af37';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
    text(title, 640, y + 66, 44, accent || '#d4af37', 'center');
    lines.forEach((line, i) => text(line, 640, y + 116 + i * 34, 19, '#e8e2ff', 'center'));
    if (prompt) text(prompt, 640, y + h - 26, 18, '#ffd94a', 'center');
  }

  function draw(state, screen, extra) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0b0812';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    const level = state.level;
    if (screen === SCREEN_TITLE) {
      // Stage the museum behind the title so the menu itself shows the game.
      drawRoom(level, state.job);
      drawLoot(level, state.job);
      drawWatchers(state.job);
      drawPlayer(state.player, false, 0);
      drawPanel('VELVET MIDNIGHT', [
        'You are WREN, gentleman thief of the velvet night.',
        'Three jobs. One crew of one. Do not get caught.',
        'Sneak past guards, dodge the sweeping cameras,',
        'lockpick the safes, grab every loot — then slip out the EXIT.',
        '',
        'WASD / arrows — move      Shift — sneak (slow, quiet)',
        'Hold E — lockpick a safe      Q — throw a noisemaker (×2 per job)',
      ], 'Click or press Enter to start Job 1', '#d4af37');
      return;
    }
    drawRoom(level, state.job);
    drawLoot(level, state.job);
    drawWatchers(state.job);
    drawPlayer(state.player, state.sneaking, state.lockProgress);
    drawHud(level, state.job, state.alarm, state.timeSec, state.totalLoot);
    if (screen === SCREEN_PAUSED) {
      drawPanel('PAUSED', [level.name, 'The guards are waiting. So is the loot.'], 'Press P or click to resume', '#7ee0ff');
    } else if (screen === SCREEN_OVER && extra) {
      const ghost = extra.ghost;
      drawPanel(extra.title, extra.lines, extra.prompt, ghost ? '#2fae5f' : '#ff4040');
      if (ghost) {
        ctx.save();
        ctx.translate(640, 190);
        ctx.rotate(-0.12);
        ctx.strokeStyle = '#2fae5f';
        ctx.lineWidth = 5;
        ctx.strokeRect(-150, -32, 300, 64);
        text('★ GHOST ★', 0, 14, 34, '#2fae5f', 'center');
        ctx.restore();
      }
    }
  }

  return { draw };
}
