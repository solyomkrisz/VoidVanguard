import BaseCustomElement from "/ui/component/core/BaseCustomElement.js";
import { path } from "/common/common.js";
import { dir, el } from "/ui/UI.js";

// Must be placed in <game-controller-container> to work
export default class PauseButton extends BaseCustomElement {
  constructor() {
    super([path.join(dir, "pauseButton.css")]);

    this._built = false;

    this.onClick = this.onClick.bind(this);
  }

  onClick(e) {
    this.dispatchEvent(
      new CustomEvent("pause-game", { bubbles: true, composed: true }),
    );
  }

  connectedCallback() {
    this.build();
    this.updateVisibility();
  }

  isTouchDevice() {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
  }

  build() {
    if (this._built) return;

    this.appendShadowChild(
      el(
        "button",
        {
          onClick: this.onClick,
        },
        ["Játék megállítása"],
      ),
    );

    this._built = true;
  }

  updateVisibility() {
    if (this.isTouchDevice()) {
      this.style.display = "block";
    } else {
      this.style.display = "none";
    }
  }
}

window.customElements.define("pause-button", PauseButton);
