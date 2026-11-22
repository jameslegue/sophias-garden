// Vertical camera for climbing. The tower is exactly one screen wide, so x never moves.
export class Camera {
  constructor(viewH, worldH) {
    this.viewH = viewH;
    this.worldH = worldH;
    this.y = 0;
  }

  target(py) { return Math.max(0, Math.min(this.worldH - this.viewH, py - this.viewH * 0.55)); }

  follow(py) { this.y += (this.target(py) - this.y) * 0.15; }

  snap(py) { this.y = this.target(py); }
}
