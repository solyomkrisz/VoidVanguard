/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/game/ChunkManager.js
 * Szerep: Hatterchunkok betolteset, cache-eleset es eltavolitasat kezeli a parallax retegekhez.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import Chunk from "/game/Chunk.js";

export default class ChunkManager {
  // ! Chunk id range is [-32768, 32767]
  static ENCODE_ID(x, y) {
    // A két koordinátát egyetlen egész számmá csomagoljuk, így gyorsan kulcsként használható a Map-ben.
    return ((x + 32768) << 16) | (y + 32768);
  }

  constructor(game) {
    this.game = game;
    this.chunks = new Map();
    // A nemrég eltávolított chunkok ide kerülnek, hogy visszatéréskor ne kelljen őket újra felépíteni.
    this.deleted = new Map();
  }

  update() {
    const { renderDistance, player, nebulaParallax, minStarParallax, chunkSize, backgroundZoom } = this.game;

    const [rx, ry] = renderDistance;

    // Ez a köd-háttér saját chunk-középpontja a parallax miatt.
    const px = Math.floor(player.position[0] * nebulaParallax / (chunkSize * backgroundZoom));
    const py = Math.floor(player.position[1] * nebulaParallax / (chunkSize * backgroundZoom));

    // A csillag-réteg lassabban mozog, ezért külön középponttal töltjük be a chunkokat.
    const spx = Math.floor(player.position[0] * minStarParallax / (chunkSize * backgroundZoom));
    const spy = Math.floor(player.position[1] * minStarParallax / (chunkSize * backgroundZoom));

    // prettier-ignore
    const loadChunk = (x, y) => {
      const id = ChunkManager.ENCODE_ID(x, y);
      if (this.chunks.has(id)) return;
      if (this.deleted.has(id)) {
        // Ha nemrég lett eltávolítva, inkább visszaélesztjük a korábbi állapotát.
        this.chunks.set(id, this.deleted.get(id).onInsert());
      } else {
        this.chunks.set(id, new Chunk(id, this.game, x, y).build().onInsert());
      }
    };

    // prettier-ignore
    for (let y = py - ry; y < py + ry; y++)
      for (let x = px - rx; x < px + rx; x++)
        loadChunk(x, y);

    // Ugyanez a betöltés külön lefut a csillag-rétegre is, hogy a két háttér együtt maradjon kitöltve.
    // prettier-ignore
    for (let y = spy - ry; y < spy + ry; y++)
      for (let x = spx - rx; x < spx + rx; x++)
        loadChunk(x, y);

    // prettier-ignore
    for (const [id, chunk] of this.chunks.entries()) {
      const [cx, cy] = chunk.position;
      const inNebula = Math.abs(cx - px)  <= rx && Math.abs(cy - py)  <= ry;
      const inStar   = Math.abs(cx - spx) <= rx && Math.abs(cy - spy) <= ry;

      if (!inNebula && !inStar) {
        chunk.onRemove();
        // Rövid ideig cache-ben tartjuk, hátha a játékos rögtön visszafordul.
        this.deleted.set(id, this.chunks.get(id));
        this.chunks.delete(id);
      }
    }

    for (const [id, chunk] of this.deleted.entries()) {
      chunk.idle += this.game.fdt;
      // Ami túl sokáig marad távol, azt végleg elengedjük, hogy ne nőjön a memóriahasználat.
      chunk.idle > 30 && this.deleted.delete(id);
    }
  }

  render() {
    this.chunks.forEach((chunk) => chunk.renderNebula());
    this.chunks.forEach((chunk) => chunk.renderStars());
    if (this.game.showChunkDebug) {
      this.chunks.forEach((chunk) => chunk.debug());
    }
  }
}
