export default class IDManager {
  constructor(max = 2 ** 16) {
    this.next = 0;
    this.pool = [];
    this.max = max;
  }

  get() {
    if (this.pool.length) return this.pool.pop();

    if (this.next >= this.max) {
      throw new Error("IDManager-get: Maximum ID limit reached!");
    }

    return this.next++;
  }

  release(id) {
    this.pool.push(id);
  }
}
