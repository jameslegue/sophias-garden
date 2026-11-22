// Fixed 60 steps per second, no matter how fast the screen refreshes.
const STEP = 1000 / 60;

export function start(update, draw) {
  let acc = 0;
  let last = performance.now();
  function frame(t) {
    acc += Math.min(t - last, 100);
    last = t;
    while (acc >= STEP) { update(); acc -= STEP; }
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
