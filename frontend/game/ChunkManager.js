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
    const { renderDistance, player } = this.game;

    const [rx, ry] = renderDistance;
    const [px, py] = player.chunk;

    // Load chunks in render distance
    // prettier-ignore
    for (let y = py - ry; y < py + ry; y++) {
      for (let x = px - rx; x < px + rx; x++) {
        const id = ChunkManager.ENCODE_ID(x, y);

        if (this.chunks.has(id)) continue;

        if (this.deleted.has(id)) {
          this.chunks.set(id, this.deleted.get(id).onInsert());
        } else {
          this.chunks.set(id, new Chunk(id, this.game, x, y).build().onInsert());
        }
      }
    }

    // Delete if not in render distance
    // prettier-ignore
    for (const [id, chunk] of this.chunks.entries()) {
      const [cx, cy] = chunk.position;

      const dx = Math.abs(cx - px), dy = Math.abs(cy - py);

      // prettier-ignore
      if (dx > rx || dy > ry) {
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
    this.chunks.forEach((chunk, _) => chunk.render());
  }
}
