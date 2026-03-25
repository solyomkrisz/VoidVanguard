import * as net from "/common/network.js";

export default class LazyItemList extends HTMLElement {
  static get observedAttributes() {
    return ["src", "mode", "page-size"];
  }

  set src(value) {
    this.setAttribute("src", value);
  }

  get src() {
    return this.getAttribute("src");
  }

  set pageSize(value) {
    this.setAttribute("page-size", value);
  }

  get pageSize() {
    return Number(this.getAttribute("page-size") || 10);
  }

  set controls(value) {
    if (!["scroll", "pages", "button"].includes(value)) {
      return;
    }

    this.setAttribute("controls", value);
  }

  get controls() {
    return this.getAttribute("controls");
  }

  constructor() {
    super();

    this._built = false;

    this._page = 1;
    this._loading = false;
    this._hasNext = true;

    this._sentinel = null;
    this._container = null;
    this._scrollObserver = null;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "src" && oldValue !== newValue) {
      this.refresh();
    }
  }

  connectedCallback() {
    if (this._built) return;
    this.build();
  }

  disconnectedCallback() {
    this._scrollObserver?.disconnect();
  }

  build() {
    this._container = this.appendChild(document.createElement("div"));

    if (this.controls === "scroll") {
      const sentinel = document.createElement("div");
      sentinel.style.height = "1px";

      this._sentinel = this.appendChild(sentinel);

      this.initScrollObserver();
    }

    this._built = true;
  }

  initScrollObserver() {
    this._scrollObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !this._loading && this._hasNext) {
          this.loadNextPage();
        }
      },
      { root: null, rootMargin: "100px" },
    );

    this._scrollObserver.observe(this._sentinel);
  }

  reobserve() {
    if (!this._scrollObserver) return;

    this._scrollObserver.unobserve(this._sentinel);
    this._scrollObserver.observe(this._sentinel);
  }

  async loadNextPage() {
    if (!this.src || this._loading || !this._hasNext) {
      return;
    }

    this._loading = true;

    try {
      const url = new URL(this.src, window.location.origin);

      url.searchParams.set("page", this._page);
      url.searchParams.set("limit", this.pageSize);

      const response = await this.executeRequest(url);

      if (!this.isValidResponse(response)) {
        throw new Error("Request failed");
      }

      const items = this.extractItems(response);

      this.renderContent(items, response);

      this._page += 1;
      this._hasNext = this.extractHasNext(response);

      this.reobserve();
    } catch (error) {
      console.error(error);
    } finally {
      this._loading = false;
    }
  }

  renderContent(items, response) {
    if (!Array.isArray(items)) return;

    for (const item of items) {
      const node = this.renderItem(item, {
        response,
        page: this._page,
        host: this,
      });

      if (node) {
        this._container.appendChild(node);
      }
    }
  }

  /** Override in subclass */
  executeRequest(url) {
    return net.send(url);
  }

  /** Override in subclass */
  isValidResponse(response) {
    return !!(response && response.success && response.result);
  }

  /** Override in subclass */
  renderItem(item) {
    const div = document.createElement("div");
    div.textContent = JSON.stringify(item);
    return div;
  }

  /** Override in subclass */
  extractItems(response) {
    return response?.result?.items;
  }

  /** Override in subclass */
  extractHasNext(response) {
    return response?.result?.hasNext;
  }

  reset() {
    this._page = 1;
    this._loading = false;
    this._hasNext = true;

    this._container.textContent = "";
  }

  refresh() {
    this.reset();
    this.loadNextPage();
  }
}

window.customElements.define("lazy-item-list", LazyItemList);
