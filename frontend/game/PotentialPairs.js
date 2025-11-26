export default class PotentialPairs {
  constructor() {
    this.objects = [];
  }

  reset() {
    this.objects.length = 0;
  }

  add(pair) {
    this.objects.push(pair);
  }
}
