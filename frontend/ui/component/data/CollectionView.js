import { element } from "/ui/UI.js";

export default class CollectionView extends HTMLElement {
  static get observedAttributes() {
    return ["items-source"];
  }

  get itemsSource() {
    return this.getAttribute("items-source");
  }

  set itemsSource(value) {
    this.setAttribute("items-source", value);
  }

  constructor() {
    super();
    this.container = null;
  }

  connectedCallback() {
    if (this._initialized) return;

    this.build();

    this._initialized = true;
  }

  build() {
    this.container = this.appendChild(element("div"));
  }

  renderContent(value) {
    const template = this.querySelector("template");

    if (!value || !Array.isArray(value) || !template) return;

    this.container.textContent = "";

    for (const item of value) {
      const fragment = template.content.cloneNode(true);
      fragment.querySelectorAll("[data-bind]").forEach((element) => {
        const key = element.dataset.bind;
        const targetProperty =
          element.getAttribute("bind-target") || "textContent";
        if (key in item) element[targetProperty] = item[key];
      });
      this.container.appendChild(fragment);
    }
  }

  subscribe(state) {
    state.sub(this.itemsSource, (_, value) => this.renderContent(value));
  }
}

window.customElements.define("collection-view", CollectionView);
