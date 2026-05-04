export default class RemoveDisguiseButton extends HTMLElement {
  constructor() {
    super();

    this._built = false;
    this._observer = null;

    this.onClick = this.onClick.bind(this);
    this.updateState = this.updateState.bind(this);
  }

  hasDisguise() {
    return !!document.querySelector("admin-module[target-user-id]");
  }

  updateState() {
    const button = this.querySelector("button");
    if (!button) return;

    const active = this.hasDisguise();
    button.disabled = !active;
    button.title = active ? "Aktív álca eltávolítása" : "Nincs aktív álca";
  }

  onClick() {
    if (!this.hasDisguise()) {
      this.updateState();
      return;
    }

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

    this.updateState();
  }

  connectedCallback() {
    this.build();

    if (!this._observer) {
      this._observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === "attributes") {
            this.updateState();
            return;
          }
        }
      });

      this._observer.observe(document.body, {
        subtree: true,
        attributes: true,
        attributeFilter: ["target-user-id"],
      });
    }

    this.updateState();
  }

  disconnectedCallback() {
    this._observer?.disconnect();
    this._observer = null;
  }

  build() {
    if (this._built) return;

    const button = this.appendChild(document.createElement("button"));

    button.dataset.sfx = "click_1";
    button.textContent = "Álca eltávolítása";
    button.addEventListener("click", this.onClick);

    this._built = true;
  }
}

window.customElements.define("remove-disguise-button", RemoveDisguiseButton);
