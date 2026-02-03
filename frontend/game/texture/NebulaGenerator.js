import * as vec2 from "../../common/vec2.js";

export default class NebulaGenerator {
  constructor(noise, noiseScale, width, height, backgroundColor) {
    this.n = noise;
    this.ns = noiseScale;
    this.w = width;
    this.h = height;
    this.bg = backgroundColor;
    this.canvas = document.createElement("canvas");
    this.c = this.canvas.getContext("2d");

    this.pixels = new Uint8Array(height * width * 4);
    this.fragCoord = new Float32Array(2);
    this.color = new Float32Array(4);

    this.v2b = new Float32Array(2); // vec2 buffer
  }

  setColor(r, g, b, a) {
    this.color[0] = r;
    this.color[1] = g;
    this.color[2] = b;
    this.color[3] = a;

    return this.color;
  }

  // prettier-ignore
  at() {
    const v = this.n.fBm(this.fragCoord[0] * this.ns, this.fragCoord[1] * this.ns, 7, 2.0, 0.5);
    const a = Math.min(1.0, Math.max(0.0, (v - 0.7) * 3.0));

    if (a < 0.0) {
      return this.setColor(...this.bg);
    }

    const H_offset = 100.0;
    const O_offset = 200.0;
    const He_offset = 300.0;

    const H_threshold = 0.1;
    const O_threshold = 0.5;
    const He_threshold = 0.0;

    const H_scale = 1.0 / 1.0;
    const O_scale = 1.0 / 2.0;
    const He_scale = 1.0 / 1.0;

    const H_pos = vec2.set(this.v2b, (this.fragCoord[0] + H_offset) * H_scale, (this.fragCoord[1] + H_offset) * H_scale);
    const H = Math.min(1.0, Math.max(0.0, this.n.fBm(H_pos[0], H_pos[1], 7, 2.0, 0.5) - H_threshold));

    const O_pos = vec2.set(this.v2b, (this.fragCoord[0] + O_offset) * O_scale, (this.fragCoord[1] + O_offset) * O_scale);
    const O = Math.min(1.0, Math.max(0.0, this.n.fBm(O_pos[0], O_pos[1], 7, 2.0, 0.5) - O_threshold));

    const He_pos = vec2.set(this.v2b, (this.fragCoord[0] + He_offset) * He_scale, (this.fragCoord[1] + He_offset) * He_scale);
    const He = Math.min(1.0, Math.max(0.0, this.n.fBm(He_pos[0], He_pos[1], 7, 2.0, 0.5) - He_threshold));

    return this.setColor(
        this.bg[0] * (1.0 - a) + H * a,
        this.bg[1] * (1.0 - a) + O * a,
        this.bg[2] * (1.0 - a) + He * a,
        1.0,
    );
  }

  get(parentPosition, newArray = false) {
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        // Must set fragCoord here, because it is used by the at function
        this.fragCoord[0] = x / this.w + parentPosition[0];
        this.fragCoord[1] = y / this.h + parentPosition[1];

        const color = this.at();
        const index = (y * this.w + x) * 4;

        this.pixels[index] = color[0] * 255;
        this.pixels[index + 1] = color[1] * 255;
        this.pixels[index + 2] = color[2] * 255;
        this.pixels[index + 3] = color[3] * 255;
      }
    }

    return newArray ? new Uint8Array(this.pixels) : this.pixels;
  }

  getImage(parentPosition) {
    this.get(parentPosition); // Must call it up here because it fills the pixels array.

    const img = new Image();

    this.canvas.width = this.w;
    this.canvas.height = this.h;

    const imageData = this.c.createImageData(this.w, this.h);

    for (let i = 0; i < this.pixels.length; i++) {
      imageData.data[i] = this.pixels[i];
    }

    this.c.putImageData(imageData, 0, 0);

    img.src = this.canvas.toDataURL("image/jpeg");

    return img;
  }
}
