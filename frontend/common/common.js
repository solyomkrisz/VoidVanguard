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
  getY = (o) => o.localPosition[1]
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
