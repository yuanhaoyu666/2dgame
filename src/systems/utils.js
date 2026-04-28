export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const rand = (min, max) => min + Math.random() * (max - min);

export function normalize(x, y) {
  const length = Math.hypot(x, y) || 1;
  return { x: x / length, y: y / length };
}

export function circleHit(a, b, extra = 0) {
  return dist(a, b) <= a.radius + b.radius + extra;
}

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function center(rect) {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}
