import Chunk from "/game/Chunk.js";

export default class ChunkManager {
  // ! Chunk id range is [-32768, 32767]
  static ENCODE_ID(x, y) {
    return ((x + 32768) << 16) | (y + 32768);
  }

  constructor(game) {
    this.game = game;
    this.chunks = new Map();
    this.deleted = new Map();
  }

  update() {
    const { renderDistance, player, nebulaParallax, minStarParallax, chunkSize, backgroundZoom } = this.game;

    const [rx, ry] = renderDistance;

    // Nebula parallax center
    const px = Math.floor(player.position[0] * nebulaParallax / (chunkSize * backgroundZoom));
    const py = Math.floor(player.position[1] * nebulaParallax / (chunkSize * backgroundZoom));

    // chunks drift far behind the nebula center as the player moves.
    const spx = Math.floor(player.position[0] * minStarParallax / (chunkSize * backgroundZoom));
    const spy = Math.floor(player.position[1] * minStarParallax / (chunkSize * backgroundZoom));

    // prettier-ignore
    const loadChunk = (x, y) => {
      const id = ChunkManager.ENCODE_ID(x, y);
      if (this.chunks.has(id)) return;
      if (this.deleted.has(id)) {
        this.chunks.set(id, this.deleted.get(id).onInsert());
      } else {
        this.chunks.set(id, new Chunk(id, this.game, x, y).build().onInsert());
      }
    };

    // prettier-ignore
    for (let y = py - ry; y < py + ry; y++)
      for (let x = px - rx; x < px + rx; x++)
        loadChunk(x, y);

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
        this.deleted.set(id, this.chunks.get(id));
        this.chunks.delete(id);
      }
    }

    for (const [id, chunk] of this.deleted.entries()) {
      chunk.idle += this.game.fdt;
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
