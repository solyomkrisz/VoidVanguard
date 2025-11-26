export default class ObjectCollection {
  constructor(game) {
    this.game = game;
    this.objects = [];
    this.deleted = [];
    this.baseLength = this.objects.length;
  }

  add(entity) {
    entity.id = this.game.idManager.get();
    this.objects.push(entity);
    this.baseLength++;
  }

  update() {
    this.objects.forEach((object) => {
      object.save();
      object.update();
    });
  }

  render() {
    this.objects.forEach((object) => object.render());
  }

  merge(...collections) {
    this.objects.length = this.baseLength;

    for (const collection of collections) {
      this.objects.push(...collection.objects);
    }

    return this;
  }
}
