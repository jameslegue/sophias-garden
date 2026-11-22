// Touch buttons, keyboard and taps on the game screen, all in one place.
const KEYS = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  Space: 'jump', KeyZ: 'jump', KeyX: 'jump', Enter: 'jump',
};

export class Input {
  constructor(canvas, pad, onGesture = () => {}) {
    this.held = { left: false, right: false, up: false, down: false, jump: false };
    this.edges = new Set(); // buttons pressed since the last game step
    this.taps = [];         // taps on the game screen, in game pixels

    const press = (k) => { if (!this.held[k]) this.edges.add(k); this.held[k] = true; };

    addEventListener('keydown', (e) => {
      const k = KEYS[e.code];
      if (!k) return;
      e.preventDefault();
      onGesture();
      press(k);
    });
    addEventListener('keyup', (e) => { const k = KEYS[e.code]; if (k) this.held[k] = false; });
    addEventListener('blur', () => { for (const k in this.held) this.held[k] = false; });

    pad.querySelectorAll('[data-k]').forEach((btn) => {
      const k = btn.dataset.k;
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        onGesture();
        try { btn.setPointerCapture(e.pointerId); } catch { /* not supported */ }
        press(k);
        btn.classList.add('on');
      });
      const release = (e) => { e.preventDefault(); this.held[k] = false; btn.classList.remove('on'); };
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((t) => btn.addEventListener(t, release));
      btn.addEventListener('contextmenu', (e) => e.preventDefault());
    });

    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      onGesture();
      const b = canvas.getBoundingClientRect();
      this.taps.push({
        x: ((e.clientX - b.left) * canvas.width) / b.width,
        y: ((e.clientY - b.top) * canvas.height) / b.height,
      });
    });
  }

  pressed(k) { return this.edges.has(k); }

  tapIn(x, y, w, h) { return this.taps.some((t) => t.x >= x && t.x < x + w && t.y >= y && t.y < y + h); }

  endStep() { this.edges.clear(); this.taps.length = 0; }
}
