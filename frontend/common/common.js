export const DATA_STRUCTURE =
  typeof Float32Array !== "undefined" ? Float32Array : Array;

export const EPSILON = 0.01;

export function LERP(a, b, alpha) {
  return a + (b - a) * alpha;
}

export function getAngleDiff(a, b) {
  const diff = a - b;
  return Math.atan2(Math.sin(diff), Math.cos(diff));
}

export function getMinMaxXY(
  target,
  objects,
  getX = (o) => o.localPosition[0],
  getY = (o) => o.localPosition[1],
) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const object of objects) {
    const x = getX(object);
    const y = getY(object);

    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  target.push(minX, minY, maxX, maxY);

  return target;
}

export function isAdjacent(objects, i, x, y) {
  const [ox, oy] = objects[i].localPosition;
  const dx = Math.abs(x - ox);
  const dy = Math.abs(y - oy);
  return dx + dy === 1;
}

export function mulberry32(seed) {
  return {
    random: function () {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

export function smoothstep(t) {
  return t * t * (3 - 2 * t);
}
