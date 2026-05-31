/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/common/noise.js
 * Szerep: Proceduralis zajgeneratorok es fraktalretegzes hatterekhez es texturakhoz.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import { LERP, mulberry32, smoothstep } from "./common.js";

class SeededNoise {
  constructor(seed) {
    this.PRNG = mulberry32(seed);
  }

  at(x, y) {
    console.warn("at() must be implemented by the subclass!");
  }

  // prettier-ignore
  fBm(x, y, layers = 3, lacunarity = 2, gain = 0.5) {
    let total = 0, frequency = 1, amplitude = 1, maxValue = 0;

    for (let i = 0; i < layers; i++) {
      total += this.at(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= gain;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }

  signedAt(x, y) {
    return (this.at(x, y) - 0.5) * 2;
  }

  // prettier-ignore
  visualize(scale) {
    const canvas = document.createElement("canvas");
    canvas.width = 600; canvas.height = 600;
    const c = canvas.getContext("2d");
    const imageData = c.createImageData(canvas.width, canvas.height);

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const value = this.at(x * scale, y * scale);
        const color = Math.floor(value * 255);

        const i = (y * canvas.width + x) * 4;

        imageData.data[i] = color; // r
        imageData.data[i + 1] = color; // g
        imageData.data[i + 2] = color; // b
        imageData.data[i + 3] = 255; // a
      }
    }

    c.putImageData(imageData, 0, 0);

    const img = new Image();
    img.src = canvas.toDataURL('image/jpeg');

    return img;
  }
}

class LatticeNoise extends SeededNoise {
  constructor({ seed = 6, size = 256 } = {}) {
    super(seed);

    this.k = size;
    this.m = size - 1;
    this.r = new Float32Array(size);
    this.p = new Int32Array(size * 2);
  }

  init() {
    console.warn(
      "init() must be implemented by the subclass and must call shuffleAndExtendPermutationTable()!",
    );
  }

  shuffleAndExtendPermutationTable() {
    for (let i = this.k - 1; i > 0; i--) {
      const j = Math.floor(this.PRNG.random() * (i + 1));
      [this.p[i], this.p[j]] = [this.p[j], this.p[i]];
    }

    for (let i = 0; i < this.k; i++) {
      this.p[i + this.k] = this.p[i];
    }
  }
}

export class WhiteNoise extends SeededNoise {
  constructor(seed) {
    super(seed);
  }

  at(x, y) {
    return this.PRNG.random();
  }
}

export class ValueNoise extends LatticeNoise {
  constructor(seed) {
    super({ seed });
    this.init();
  }

  init() {
    for (let i = 0; i < this.k; i++) {
      this.r[i] = this.PRNG.random();
      this.p[i] = i;
    }

    this.shuffleAndExtendPermutationTable();
  }

  at(x, y) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);

    const tx = x - xi;
    const ty = y - yi;

    const sx = smoothstep(tx);
    const sy = smoothstep(ty);

    const x0 = xi & this.m;
    const y0 = yi & this.m;
    const x1 = (x0 + 1) & this.m;
    const y1 = (y0 + 1) & this.m;

    const x0y0 = this.r[this.p[this.p[x0] + y0]];
    const x1y0 = this.r[this.p[this.p[x1] + y0]];
    const x0y1 = this.r[this.p[this.p[x0] + y1]];
    const x1y1 = this.r[this.p[this.p[x1] + y1]];

    const x0y0_x1y0 = LERP(x0y0, x1y0, sx);
    const x0y1_x1y1 = LERP(x0y1, x1y1, sx);

    return LERP(x0y0_x1y0, x0y1_x1y1, sy);
  }
}

export class PerlinNoise extends LatticeNoise {
  constructor(seed) {
    super({ seed });

    this.r = new Float32Array(this.k * 2); // gradients

    this.init();
  }

  init() {
    for (let i = 0; i < this.k; i++) {
      const a = 2 * this.PRNG.random() * Math.PI;

      this.r[i * 2] = Math.cos(a);
      this.r[i * 2 + 1] = Math.sin(a);

      this.p[i] = i;
    }

    this.shuffleAndExtendPermutationTable();
  }

  hash(x, y) {
    return this.p[this.p[x] + y];
  }

  // prettier-ignore
  at(x, y) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);

    const tx = x - xi;
    const ty = y - yi;

    const sx = smoothstep(tx);
    const sy = smoothstep(ty);

    const x0 = xi & this.m;
    const y0 = yi & this.m;
    const x1 = (x0 + 1) & this.m;
    const y1 = (y0 + 1) & this.m;

    const x0y0gi = this.hash(x0, y0) * 2;
    const x0y0gx = this.r[x0y0gi], x0y0gy = this.r[x0y0gi + 1];

    const x1y0gi = this.hash(x1, y0) * 2;
    const x1y0gx = this.r[x1y0gi], x1y0gy = this.r[x1y0gi + 1];

    const x0y1gi = this.hash(x0, y1) * 2;
    const x0y1gx = this.r[x0y1gi], x0y1gy = this.r[x0y1gi + 1];

    const x1y1gi = this.hash(x1, y1) * 2;
    const x1y1gx = this.r[x1y1gi], x1y1gy = this.r[x1y1gi + 1];

    const x0y0_p_x =     tx, x0y0_p_y =     ty;
    const x1y0_p_x = tx - 1, x1y0_p_y =     ty;
    const x0y1_p_x =     tx, x0y1_p_y = ty - 1;
    const x1y1_p_x = tx - 1, x1y1_p_y = ty - 1;

    const dot_x0y0 = x0y0gx * x0y0_p_x + x0y0gy * x0y0_p_y;
    const dot_x1y0 = x1y0gx * x1y0_p_x + x1y0gy * x1y0_p_y;
    const dot_x0y1 = x0y1gx * x0y1_p_x + x0y1gy * x0y1_p_y;
    const dot_x1y1 = x1y1gx * x1y1_p_x + x1y1gy * x1y1_p_y;

    const a = LERP(dot_x0y0, dot_x1y0, sx);
    const b = LERP(dot_x0y1, dot_x1y1, sx);

    return (LERP(a, b, sy) + 1) * 0.5;
  }
}
