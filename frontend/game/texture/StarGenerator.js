import { clamp, inCircle } from "../../common/common.js";

export default class StarGenerator {
  constructor(noise, width, height) {
    this.noise = noise;
    this.w = width;
    this.h = height;
  }

  // prettier-ignore
  populate(position, pixels, r) {
    const R = 0,
          G = 255,
          B = 255,
          A = 255;

    const w = this.w,
          h = this.h;

    const { r: c, p, m } = this.noise;

    const xi = Math.floor(position[0]),
          yi = Math.floor(position[1]);

    const x0 = xi & m,
          y0 = yi & m,
          x1 = (x0 + 1) & m,
          y1 = (y0 + 1) & m;

    const ru = c[p[p[x0] + y0]],
          rv = c[p[p[x1] + y1]];

    const minX = r,
          maxX = w - r,
          minY = r,
          maxY = h - r;

    const u = Math.floor(ru * maxX - minX + 1) + minX,
          v = Math.floor(rv * maxY - minY + 1) + minY;

    for (let y = v - r; y < v + r; y++) {
      for (let x = u - r; x < u + r; x++) {
        const d = (x - u) * (x - u) + (y - v) * (y - v);

        // if (d > this.r * this.r) continue;

        const u0 = u - r, v0 = v - r,
              u1 = u + r, v1 = v - r,
              u2 = u + r, v2 = v + r,
              u3 = u - r, v3 = v + r;

        if (
          inCircle(x, y, u0, v0, r) ||
          inCircle(x, y, u1, v1, r) ||
          inCircle(x, y, u2, v2, r) ||
          inCircle(x, y, u3, v3, r)
        ) {
          continue;
        }

        const i = (y * w + x) * 4;

        const a = clamp(d / (r * r) + 0.15);

        pixels[i + 0] = R * (1 - a);
        pixels[i + 1] = G * (1 - a);
        pixels[i + 2] = B;
        pixels[i + 3] = A;
      }
    }

    return pixels;
  }
}
