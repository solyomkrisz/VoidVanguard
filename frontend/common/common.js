import * as net from "./network.js";
import userState from "../state/user.js";

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

export function clamp(n, min = 0, max = 1) {
  return Math.min(max, Math.max(min, n));
}

export function inCircle(x, y, u, v, r) {
  return (x - u) * (x - u) + (y - v) * (y - v) <= r * r;
}

export function extractForm(form, includeEmpty = false) {
  if (!(form instanceof HTMLFormElement)) {
    return console.error("Received a non-form element");
  }
  const result = {};
  for (const [key, value] of new FormData(form)) {
    if (!includeEmpty && value.length === 0) continue;
    result[key] = value;
  }
  return result;
}

export const path = Object.freeze({
  join: function (a, b) {
    return a + b;
  },
});

export async function onDOMContentLoaded() {
  try {
    const result = await net.send("/api/sessions", { method: "POST" });
    result.success && userState.from(result.result);
  } catch (error) {
    return;
  }
}

export function debounce(fn, delay) {
  let timerId;

  return function (...args) {
    clearTimeout(timerId);

    timerId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}
