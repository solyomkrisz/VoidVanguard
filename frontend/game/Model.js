export default class Model {
  static COPY_MODE = Object.freeze({
    COPY: 0,
    PRESERVE: 1 << 0,
  });

  constructor(objects, mode = Model.COPY_MODE.COPY) {
    if (mode === Model.COPY_MODE.PRESERVE) this.objects = objects;
    else if (mode === Model.COPY_MODE.COPY) {
      this.objects = [];
      for (const object of objects) {
        this.objects.push(
          Object.assign(Object.create(Object.getPrototypeOf(object)), object)
        );
      }
    }
  }
}
