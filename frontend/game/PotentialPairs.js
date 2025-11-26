export default class PotentialPairs {
  constructor(game) {
    this.game = game;
    this.objects = [];
  }

  reset() {
    this.objects.length = 0;
  }

  add(pair) {
    this.objects.push(pair);
  }
}
