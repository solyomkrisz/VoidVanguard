import * as net from "/common/network.js";
import { element } from "/ui/UI.js";
import _ from "/ui/component/core/StateProviderElement.js";

export default class LazyList extends HTMLElement {
  static get observedAttributes() {
    return ["src", "page-size", "mode", "items-source", "provide-state"];
  }

  get src() {
    return this.getAttribute("src");
  }

  set src(value) {
    this.setAttribute("src", value);
    this.refresh();
    // this.loadNextPage();
  }

  get pageSize() {
    return this.getAttribute("page-size");
  }

  set pageSize(value) {
    this.setAttribute("page-size", value);
  }

  get mode() {
    return this.getAttribute("mode");
  }

  set mode(value) {
    if (!["scroll", "pages", "button"].includes(value)) {
      return;
    }
    this.setAttribute("mode", value);
  }

  get itemsSource() {
    return this.getAttribute("items-source");
  }

  set itemsSource(value) {
    this.setAttribute("items-source", value);
  }

  get provideState() {
    return this.hasAttribute("provide-state");
  }

  constructor() {
    super();

    this.page = 1;
    this.loading = false;
    this.hasNext = true;

    this.container = null;
    this.sentinel = null;

    this.scrollObserver = null;
  }

  connectedCallback() {
    if (this._initialized) return;

    this.build();
    // this.loadNextPage();

    this._initialized = true;
  }

  disconnectedCallback() {
    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
    }
  }

  build() {
    this.container = this.appendChild(element("div"));
    this.sentinel = this.appendChild(element("div").styl("height", "1px"));

    if (this.mode === "scroll") {
      this.initScrollObserver();
    }
  }

  initScrollObserver() {
    this.scrollObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !this.loading && this.hasNext) {
          this.loadNextPage();
        }
      },
      { root: null, rootMargin: "100px" },
    );

    this.scrollObserver.observe(this.sentinel);
  }

  async loadNextPage() {
    if (!this.src || this.loading || !this.hasNext) return;
    this.loading = true;

    try {
      const url = new URL(this.src, window.location.origin);

      url.searchParams.set("page", this.page);
      url.searchParams.set("limit", this.pageSize);

      const { success, result } = await net.send(url);

      if (!success || !result) throw null;

      this.renderContent(result[this.itemsSource]);

      this.page += 1;
      this.hasNext = result.hasNext ?? false;

      if (this.scrollObserver) {
        this.scrollObserver.unobserve(this.sentinel);
        this.scrollObserver.observe(this.sentinel);
      }
    } catch (error) {
      console.error(error);
    } finally {
      this.loading = false;
    }
  }

  renderContent(value) {
    const template = this.querySelector("template");

    if (!value || !Array.isArray(value) || !template) return;

    // this.container.textContent = "";

    for (const item of value) {
      const fragment = template.content.cloneNode(true);

      this.container.appendChild(fragment);
      const listItem = this.container.lastElementChild;

      if (this.provideState) {
        const stateProvider = listItem.querySelector("state-provider");

        if (stateProvider) {
          stateProvider.from(item);
        }
      }

      listItem.querySelectorAll("[data-bind]").forEach((element) => {
        const key = element.dataset.bind;
        const targetProperty =
          element.getAttribute("bind-target") || "textContent";
        if (key in item) element[targetProperty] = item[key];
      });
    }
  }

  reset() {
    this.page = 1;
    this.loading = false;
    this.hasNext = true;

    this.container.textContent = "";
  }

  refresh() {
    this.reset();
    this.loadNextPage();
  }
}

window.customElements.define("lazy-list", LazyList);
