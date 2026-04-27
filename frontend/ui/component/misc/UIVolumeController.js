import "/ui/component/form/InputGroup.js";
import VolumeController from "/ui/component/misc/VolumeController.js";
import globalAudio from "/common/globalAudio.js";

export default class UIVolumeController extends VolumeController {
  constructor() {
    super();

    this.localStorageKey = "ui_volume";
    this.labelText = "UI hangerő";
  }

  update() {
    const volume = super.update();
    globalAudio.setVolume(volume);
  }
}

window.customElements.define("ui-volume-controller", UIVolumeController);
