/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/game/Chunk.js
 * Szerep: Proceduralisan epulo hatterchunk dekoracios objektumokkal.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import * as vec2 from "/common/vec2.js";
import * as vec3 from "/common/vec3.js";
import ObjectCollection from "/game/ObjectCollection.js";
import DecorationBlock from "/game/DecorationBlock.js";
import * as Type from "/game/Type.js";

export default class Chunk {
  constructor(id, game, x, y) {
    // Egy chunk egy hatterdarab: sajat racspozicioja van, es a benne elo dekoracios objektumokat kulon gyujti.
    this.id = id;
    this.game = game;
    this.built = false;
    this.position = vec2.fromValues(x, y);
    this.objects = new ObjectCollection(game);
    this.idle = 0;
  }

  onRemove() {
    // Ha a chunk kikerul az aktiv teruletrol, a benne levo objektumok is kapnak lehetoseget a sajat takaritasukra.
    this.objects.forEach((object) => object.onRemove());

    return this;
  }

  onInsert() {
    // Visszarakaskor ugyanigy szolunk minden dekoracios objektumnak, hogy ujra aktivva valt.
    this.objects.forEach((object) => object.onInsert());

    return this;
  }

  // We must initialize the noise we want to use in game
  // prettier-ignore
  build() {
    // A proceduralis epites a chunk racspoziciojabol indul, majd zajmintaval donti el, melyik cellakba kerul koddekoracio.
    if (this.built) return;

    const { chunkSize, noise, noiseScale } = this.game;

    const x0 = this.position[0] * chunkSize;
    const y0 = this.position[1] * chunkSize;
    const x1 = x0 + chunkSize;
    const y1 = y0 + chunkSize;

    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const density = noise.fBm(x * noiseScale, y * noiseScale);

        if (density > 0.64) {
          this.objects.add(new DecorationBlock({ type: Type.NEBULA, game: this.game, x, y, density }));
        }
      }
    }

    this.built = true;

    return this;
  }

  update() {
    // A chunk maga csak tovabbitja az update-et a benne elo dekoracios objektumoknak.
    this.objects.update();
  }

  renderNebula() {
    // A hatter rajzolas kulon fazisokra van bontva, hogy a kod es a csillagok megfelelo sorrendben jelenjenek meg.
    this.objects.forEach((object) => object.renderNebula?.());
  }

  renderStars() {
    // A csillagok kulon passban mennek, mert mas latvanyreteget alkotnak, mint a kodfoltok.
    this.objects.forEach((object) => object.renderStars?.());
  }

  render() {
    // A hagyomanyos objektumrender utan opcionálisan a chunk debug kerete is kirajzolhato.
    this.objects.render();
    if (this.game.showChunkDebug) {
      this.debug();
    }
  }

  // prettier-ignore
  debug() {
    // A chunk racskoordinatait itt alakitjuk at kepernyopoziciova, hogy a debug overlay a helyes helyre rajzolhassa a keretet es a cimet.
    const g = this.game, b = g.buffer, d = g.debugOverlay;
    const size = this.game.chunkSize * 0.5 * g.cameraMatrix[0] * g.canvas.width * g.backgroundZoom;

    const position = vec2.copy(b.vec2_1, this.position);
    vec2.scale(position, position, g.chunkSize);
    position[0] += g.chunkSize / 2;
    position[1] += g.chunkSize / 2;

    position[0] *= g.backgroundZoom;
    position[1] *= g.backgroundZoom;

    // Block aligned bounds
    // In the vertex shader we shift the background tiles by 0.5 so their corner is at their given position (instead of the their center)
    // position[0] -= 0.5 * g.backgroundZoom;
    // position[1] -= 0.5 * g.backgroundZoom;

    const worldSpace = vec2.toVec3(b.vec3_1, position);
    const [csx, csy] = vec3.toVec2(b.vec2_1, vec3.transformMat3Into(worldSpace, g.cameraMatrix, worldSpace));

    const x = (csx + 1) * 0.5 * g.canvas.width;
    const y = (1 - csy) * 0.5 * g.canvas.height;

    d.drawBox(x, y, size, size, "rgba(0, 255, 0, 1)", 1);
    d.drawText(x, y, `chunk: (${this.position}), id: ${this.id}`, "20px Jersey", "rgba(0, 255, 0, 1)");
  }
}
