export default class RemoveDisguiseButton extends HTMLElement {
  constructor() {
    super();

    this._built = false;

    this.onClick = this.onClick.bind(this);
  }

  onClick() {
    const modules = document.querySelectorAll("admin-module");

    for (const module of modules) {
      if (module.hasAttribute("target-user-id")) {
        module.removeAttribute("target-user-id");
      }
    }

    const info = document.querySelector("#disguise-info");
    if (info) {
      info.textContent = "";
    }

    document.querySelector("comment-section[admin]")?.partialRefresh();
    document
      .querySelector("search-bar-result-list")
      ?.removeAttribute("target-user-id");
  }

  connectedCallback() {
    this.build();
  }

  build() {
    if (this._built) return;

    const button = this.appendChild(document.createElement("button"));

    button.textContent = "Álca eltávolítása";
    button.addEventListener("click", this.onClick);

    this._built = true;
  }
}

window.customElements.define("remove-disguise-button", RemoveDisguiseButton);
