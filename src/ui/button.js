// Chunky on-screen menu button.
export function drawButton(r, b, selected) {
  r.box(b.x, b.y, b.w, b.h, selected ? 'R' : 'P', selected ? 'Y' : 'M');
  r.textC(b.label, b.x + b.w / 2, b.y + Math.floor((b.h - 5) / 2), 'W', 1, 'K');
}

export function tapped(input, b) { return input.tapIn(b.x - 2, b.y - 2, b.w + 4, b.h + 4); }
