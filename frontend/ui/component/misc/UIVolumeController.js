import "/ui/component/form/InputGroup.js";
import globalAudio from "/common/globalAudio.js";

export default class UIVolumeController extends HTMLElement {
  constructor() {
    super();

    this._elements = {};
    this._built = false;

    this.onStorageEvent = this.onStorageEvent.bind(this);
    this.onInput = this.onInput.bind(this);
  }

  onStorageEvent(e) {
    if (event.key !== "ui_volume") return;
    this.sync();
  }

  onInput(e) {
    this.update();
  }

  connectedCallback() {
    this.build();

    this.sync();

    window.addEventListener("storage", this.onStorageEvent);
  }

  disconnectedCallback() {
    window.removeEventListener("storage", this.onStorageEvent);
  }

  build() {
    if (this._built) return;

    this.innerHTML = `
        <input-group>
            <label>UI hangereje:</label>
            <div class="input-container">
                <input type="range" min="0" max="1" step="0.01" />
                <div id="current-volume">100</div>
            </div>
        </input-group>
    `;

    this._elements.input = this.querySelector("input");
    this._elements.input.addEventListener("input", this.onInput);

    this._elements.currentVolume = this.querySelector("#current-volume");

    this._built = true;
  }

  sync() {
    const volume = localStorage.getItem("ui_volume") ?? 1;
    this._elements.input.value = Number(volume);
    this._elements.currentVolume.textContent = parseInt(volume * 100);
  }

  update() {
    const volume = Number(this._elements.input.value);
    this._elements.currentVolume.textContent = parseInt(volume * 100);
    localStorage.setItem("ui_volume", volume);
    globalAudio.setVolume(volume);
  }
}

window.customElements.define("ui-volume-controller", UIVolumeController);
