// VELVET MIDNIGHT — keyboard + mouse input state.
// Keys are tracked by `code` so WASD and arrows both work; the game reads
// `keys` each frame and `consumePressed` for one-shot actions (Q, P, R, E).

export const keys = {};
const pressed = {};
export const mouse = { x: 0, y: 0, clicked: false, clickX: 0, clickY: 0 };

export function initInput(canvas) {
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (!keys[e.code]) pressed[e.code] = true;
    keys[e.code] = true;
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });
  window.addEventListener('blur', () => { for (const k of Object.keys(keys)) keys[k] = false; });
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - r.left) / r.width) * 1280;
    mouse.y = ((e.clientY - r.top) / r.height) * 720;
  });
  canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.clickX = ((e.clientX - r.left) / r.width) * 1280;
    mouse.clickY = ((e.clientY - r.top) / r.height) * 720;
    mouse.clicked = true;
  });
}

export function consumePressed(code) {
  if (pressed[code]) { pressed[code] = false; return true; }
  return false;
}

export function consumeClick() {
  if (mouse.clicked) { mouse.clicked = false; return { x: mouse.clickX, y: mouse.clickY }; }
  return null;
}

export function moveVector() {
  let x = 0;
  let y = 0;
  if (keys['KeyA'] || keys['ArrowLeft']) x -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) x += 1;
  if (keys['KeyW'] || keys['ArrowUp']) y -= 1;
  if (keys['KeyS'] || keys['ArrowDown']) y += 1;
  if (x !== 0 && y !== 0) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
  return { x, y };
}

export function isSneaking() {
  return !!(keys['ShiftLeft'] || keys['ShiftRight']);
}

export function isHoldingInteract() {
  return !!(keys['KeyE']);
}
