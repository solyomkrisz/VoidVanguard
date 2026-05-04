import { clamp, inCircle } from "/common/common.js";

export default class StarGenerator {
  constructor(noise, width, height) {
    this.noise = noise;
    this.w = width;
    this.h = height;
  }

  // prettier-ignore
  populate(position, pixels, r) {
    const A = 255;

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

    const rc = c[p[p[x1] + y0]];
    let R = 255, G = 255, B = 255;
    if      (rc < 0.10) { R = 150; G = 150; B = 255; } // kekes feher
    else if (rc < 0.18) { R = 255; G = 245; B = 170; } // picit sarga
    else if (rc < 0.23) { R = 255; G = 254; B = 225; } // feher

    // Distance factor: 0.3 (far/dim/min) to 1.0 (close/bright/max)
    const rd = c[p[p[x0] + y1]];
    const distanceFactor = 0.3 + rd * 0.7;
    const actualR = Math.max(1, Math.round(r * distanceFactor));
    const brightnessMult = distanceFactor;

    const minX = actualR,
          maxX = w - actualR,
          minY = actualR,
          maxY = h - actualR;

    const u = Math.floor(ru * maxX - minX + 1) + minX,
          v = Math.floor(rv * maxY - minY + 1) + minY;

    for (let y = v - actualR; y < v + actualR; y++) {
      for (let x = u - actualR; x < u + actualR; x++) {
        const d = (x - u) * (x - u) + (y - v) * (y - v);

        const u0 = u - actualR, v0 = v - actualR,
              u1 = u + actualR, v1 = v - actualR,
              u2 = u + actualR, v2 = v + actualR,
              u3 = u - actualR, v3 = v + actualR;

        if (
          inCircle(x, y, u0, v0, actualR) ||
          inCircle(x, y, u1, v1, actualR) ||
          inCircle(x, y, u2, v2, actualR) ||
          inCircle(x, y, u3, v3, actualR)
        ) {
          continue;
        }

        const i = (y * w + x) * 4;

        const a = clamp(d / (actualR * actualR) + 0.15);
        const brightness = (1 - a) * brightnessMult;

        pixels[i + 0] = R * brightness;
        pixels[i + 1] = G * brightness;
        pixels[i + 2] = B * brightness;
        pixels[i + 3] = A;
      }
    }

    return { pixels, distanceFactor };
  }
}
