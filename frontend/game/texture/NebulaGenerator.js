/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/game/texture/NebulaGenerator.js
 * Szerep: Proceduralis kodtexturak rajzolo generatora.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import * as vec2 from "/common/vec2.js";

export default class NebulaGenerator {
  // Nebula types defined by their elemental composition weights.
  // H (Hydrogen) → red/pink (H-alpha 656 nm)
  // O (Oxygen)   → teal/cyan (O III ~500 nm)
  // He (Helium)  → blue/violet (He II ~468 nm)
  // density: scales how quickly alpha ramps up (higher = denser/brighter)
  static TYPES = [
    { H: 1.2, O: 0.05, He: 0.20, density: 3.0 }, // 0: Emission — red/pink (H-alpha dominant)
    { H: 0.05, O: 1.2, He: 0.30, density: 3.0 }, // 1: Oxygen-rich — teal/cyan (O III dominant)
    { H: 0.10, O: 0.20, He: 1.2, density: 3.0 }, // 2: Helium-rich — deep blue/violet
    { H: 1.0, O: 0.05, He: 0.95, density: 2.5 }, // 3: Wolf-Rayet — purple/magenta (H + He)
    { H: 0.80, O: 0.90, He: 0.15, density: 3.5 }, // 4: Star-forming — warm orange/green (H + O)
  ];

  constructor(noise, noiseScale, width, height, backgroundColor) {
    // A generator egyszerre tarolja a zajforrast, a celmeretet es a belso buffer tomboket, hogy sok pixelt lehessen ujrafelhasznalva szamolni.
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
    this.currentType = NebulaGenerator.TYPES[0];
  }

  setColor(r, g, b, a) {
    // A visszaadott szin mindig ugyanabba a bufferbe ir, igy pixelgeneralas kozben nem keletkezik felesleges uj tomb minden mintanal.
    this.color[0] = r;
    this.color[1] = g;
    this.color[2] = b;
    this.color[3] = a;

    return this.color;
  }

  // prettier-ignore
  at() {
    // Egyetlen fragCoord helyen itt dol el a kod szine es atlatszosaga a kulonbozo zajmintak keveresebol.
    // Type noise uses a higher frequency (0.25) so the visible world spans multiple
    // lattice periods, ensuring color variety across all seeds
    // We also blend continuously between adjacent types to avoid sharp colour edges(previously was clipping at multiple parts))
    // Sample low-frequency noise to get a smooth [0..1] value that varies slowly
    // across world space. The asymmetric frequencies (0.25 x, 0.05 y) stretch the
    // colour regions horizontally, giving large band-like zones instead of round blobs.
    const typeNoise = this.n.fBm(this.fragCoord[0] * 0.25, this.fragCoord[1] * 0.05, 3, 2.0, 0.5);
    // Map the [0..1] noise value to a continuous float index in [0..TYPES.length).
    // e.g. with 5 types: noise=0.0 → 0.0, noise=0.5 → 2.5, noise=1.0 → 5.0
    // The integer and fractional parts are split below to blend between two adjacent types,
    // so there are no hard colour edges — every pixel is always a mix of exactly two types.
    const typeIndexF = typeNoise * NebulaGenerator.TYPES.length;
    // Integer index of the type to blend FROM (wrapped in case noise reaches exactly 1.0).
    const i0 = Math.floor(typeIndexF) % NebulaGenerator.TYPES.length;
    // Integer index of the type to blend TO (the next one, wrapping around at the end).
    const i1 = (i0 + 1) % NebulaGenerator.TYPES.length;
    // Fractional part of typeIndexF — used as the interpolation weight (0 = fully t0, 1 = fully t1).
    const blend = typeIndexF - Math.floor(typeIndexF);
    // The two adjacent nebula type descriptors that will be linearly blended together.
    const t0 = NebulaGenerator.TYPES[i0];
    const t1 = NebulaGenerator.TYPES[i1];
  
    const H_w  = t0.H       * (1 - blend) + t1.H       * blend;
    const O_w  = t0.O       * (1 - blend) + t1.O       * blend;
    const He_w = t0.He      * (1 - blend) + t1.He      * blend;
    const dens = t0.density * (1 - blend) + t1.density * blend;

    const v = this.n.fBm(this.fragCoord[0] * this.ns, this.fragCoord[1] * this.ns, 7, 2.0, 0.5);
    const a = Math.min(1.0, Math.max(0.0, (v - 0.7) * dens));

    if (a <= 0.0) {
      return this.setColor(0, 0, 0, 0);
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
    const H = Math.min(1.0, Math.max(0.0, this.n.fBm(H_pos[0], H_pos[1], 7, 2.0, 0.5) - H_threshold)) * H_w;

    const O_pos = vec2.set(this.v2b, (this.fragCoord[0] + O_offset) * O_scale, (this.fragCoord[1] + O_offset) * O_scale);
    const O = Math.min(1.0, Math.max(0.0, this.n.fBm(O_pos[0], O_pos[1], 7, 2.0, 0.5) - O_threshold)) * O_w;

    const He_pos = vec2.set(this.v2b, (this.fragCoord[0] + He_offset) * He_scale, (this.fragCoord[1] + He_offset) * He_scale);
    const He = Math.min(1.0, Math.max(0.0, this.n.fBm(He_pos[0], He_pos[1], 7, 2.0, 0.5) - He_threshold)) * He_w;

    return this.setColor(H, O, He, a);
  }

  get(parentPosition, newArray = false) {
    // Vegigmegyunk a teljes texturan, minden pixelhez vilagpoziciot kepezunk, majd az at() eredmenyet irjuk be az RGBA tombbe.
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
    // Ez a helper a nyers pixelbufferbol keszit egy tenyleges kepobjektumot, amit a tobbi renderresz mar kozvetlenul fel tud hasznalni.
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
