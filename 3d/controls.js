// Phone: left half of the screen is a joystick (it appears where your thumb lands),
// right half drags to look around, plus a big JUMP button.
// Computer: WASD / arrows to move, Space to jump, Q/E (or drag) to look.
const RADIUS = 50; // joystick reach in screen pixels

export class Controls {
  constructor(canvas, jumpBtn, joyBase, joyKnob, onGesture) {
    this.joy = null;
    this.look = null;
    this.yaw = 0;
    this.pitch = 0;
    this.jumpEdge = false;
    this.keys = new Set();
    this.base = joyBase;
    this.knob = joyKnob;

    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      onGesture();
      try { canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      if (e.clientX < innerWidth / 2 && !this.joy) {
        this.joy = { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: 0, y: 0 };
        this.showJoy(e.clientX, e.clientY, 0, 0);
      } else if (!this.look) {
        this.look = { id: e.pointerId, x: e.clientX, y: e.clientY };
      }
    });
    canvas.addEventListener('pointermove', (e) => {
      if (this.joy?.id === e.pointerId) {
        let dx = e.clientX - this.joy.ox, dy = e.clientY - this.joy.oy;
        const d = Math.hypot(dx, dy);
        if (d > RADIUS) { dx *= RADIUS / d; dy *= RADIUS / d; }
        this.joy.x = dx / RADIUS;
        this.joy.y = dy / RADIUS;
        this.showJoy(this.joy.ox, this.joy.oy, dx, dy);
      } else if (this.look?.id === e.pointerId) {
        this.yaw -= (e.clientX - this.look.x) * 0.009;
        this.pitch += (e.clientY - this.look.y) * 0.006;
        this.look.x = e.clientX;
        this.look.y = e.clientY;
      }
    });
    const release = (e) => {
      if (this.joy?.id === e.pointerId) { this.joy = null; this.base.style.display = 'none'; }
      if (this.look?.id === e.pointerId) this.look = null;
    };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((t) => canvas.addEventListener(t, release));

    jumpBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      onGesture();
      this.jumpEdge = true;
      jumpBtn.classList.add('on');
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => jumpBtn.addEventListener(t, () => jumpBtn.classList.remove('on')));

    addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      onGesture();
      if (e.code === 'Space' && !this.keys.has('Space')) this.jumpEdge = true;
      this.keys.add(e.code);
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
  }

  showJoy(x, y, dx, dy) {
    this.base.style.display = 'block';
    this.base.style.left = `${x}px`;
    this.base.style.top = `${y}px`;
    this.knob.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  // Move input: x = right, y = forward, each -1..1
  move() {
    const k = (a, b) => (this.keys.has(a) || this.keys.has(b) ? 1 : 0);
    let x = k('KeyD', 'ArrowRight') - k('KeyA', 'ArrowLeft');
    let y = k('KeyW', 'ArrowUp') - k('KeyS', 'ArrowDown');
    if (this.joy) { x += this.joy.x; y -= this.joy.y; }
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    return { x, y };
  }

  // Camera turn since last frame (radians)
  takeLook(dt) {
    const k = (this.keys.has('KeyQ') ? 1 : 0) - (this.keys.has('KeyE') ? 1 : 0);
    const out = { yaw: this.yaw + k * 2.2 * dt, pitch: this.pitch };
    this.yaw = 0;
    this.pitch = 0;
    return out;
  }

  takeJump() {
    const j = this.jumpEdge;
    this.jumpEdge = false;
    return j;
  }
}
