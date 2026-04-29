export default class BackButton extends HTMLElement {
  get mode() {
    return this.getAttribute("mode");
  }

  constructor() {
    super();

    this._built = false;
  }

  connectedCallback() {
    this.build();
  }

  build() {
    if (this._built) return;

    const button = document.createElement("button");
    button.innerHTML = "&#8592; Vissza";
    button.id = "backBtn";
    this.appendChild(button);

    button.addEventListener("click", () => {
      if (this.mode === "to-previous" && window.history.length > 1) {
        window.history.back();
        return;
      }

      window.top.location.href = "/";
    });

    this._built = true;
  }
}

window.customElements.define("back-button", BackButton);
