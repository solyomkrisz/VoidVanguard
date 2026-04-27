export default class VolumeController extends HTMLElement {
  constructor() {
    super();

    this.localStorageKey = null;
    this.labelText = "";

    this._elements = {};
    this._built = false;

    this.onStorageEvent = this.onStorageEvent.bind(this);
    this.onInput = this.onInput.bind(this);
  }

  getSavedValue() {
    return Number(localStorage.getItem(this.localStorageKey) ?? 1);
  }

  onStorageEvent(e) {
    if (this.localStorageKey && e.key === this.localStorageKey) {
      this.sync();
    }
  }

  onInput(e) {
    this.update();
  }

  connectedCallback() {
    this.build();

    this.sync();

    if (this.localStorageKey) {
      window.addEventListener("storage", this.onStorageEvent);
    }
  }

  disconnectedCallback() {
    if (this.localStorageKey) {
      window.removeEventListener("storage", this.onStorageEvent);
    }
  }

  build() {
    if (this._built) return;

    this.innerHTML = `
      <input-group>
        <label>${this.labelText}</label>
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
    const volume = this.getSavedValue();
    this._elements.input.value = volume;
    this._elements.currentVolume.textContent = parseInt(volume * 100);
  }

  update() {
    const volume = Number(this._elements.input.value);
    this._elements.currentVolume.textContent = parseInt(volume * 100);

    if (this.localStorageKey) {
      localStorage.setItem(this.localStorageKey, volume);
    }

    return volume;
  }
}
