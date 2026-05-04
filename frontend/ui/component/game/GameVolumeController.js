import VolumeController from "/ui/component/misc/VolumeController.js";

export default class GameVolumeController extends VolumeController {
  constructor() {
    super();

    this.localStorageKey = "game_volume";
    this.labelText = "Játék hangerő";
  }

  update() {
    const volume = super.update();

    this.dispatchEvent(
      new CustomEvent("game-volume-change", {
        detail: { volume },
        composed: true,
        bubbles: true,
      }),
    );

    return volume;
  }
}

window.customElements.define("game-volume-controller", GameVolumeController);
