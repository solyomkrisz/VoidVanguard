import * as net from "/common/network.js";
import "/ui/component/button/PaginationControls.js";

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
    if (!["scroll", "pagination", "button", "none"].includes(value)) {
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

    this._lastResponse = null;
    this._page = 1;
    this._loading = false;
    this._hasNext = true;

    this._scrollObserver = null;

    this._container = null;
    this._controllerContainer = null;
    this._sentinel = null; // controls="scroll"
    this._button = null; // controls="button"
    this._paginationControls = null; // controls="pages"

    this._byPage = new Map();
    this._cacheLimit = 4;

    this.loadMore = this.loadMore.bind(this);

    this._deferredAttributes = new Map();
    this._activeLoadToken = null;

    this.onRefreshButtonClick = this.onRefreshButtonClick.bind(this);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this._built) {
      this._deferredAttributes.set(name, newValue);
      return;
    }

    if (name === "src" && oldValue !== newValue && newValue) {
      this.refresh();
    }
  }

  connectedCallback() {
    if (this._built && this.controls === "scroll") {
      this._scrollObserver.observe?.(this._sentinel);
      return;
    }

    this.build();
  }

  disconnectedCallback() {
    this._scrollObserver?.disconnect();
  }

  onRefreshButtonClick(e) {
    if (this._loading) return;
    this.partialRefresh();
  }

  build() {
    if (this._built) return;

    this._refreshButton = this.appendChild(document.createElement("button"));
    this._refreshButton.type = "button";
    this._refreshButton.classList.add("lazy-item-list-refresh-button");
    this._refreshButton.textContent = "Frissítés";
    this._refreshButton.addEventListener("click", this.onRefreshButtonClick);

    this._container = this.appendChild(document.createElement("div"));
    this._container.setAttribute("aria-live", "polite");
    this._container.classList.add("item-container");

    this._controllerContainer = this.appendChild(document.createElement("div"));
    this._controllerContainer.classList.add("controller-container");

    if (this.controls === "scroll") {
      const sentinel = document.createElement("div");
      sentinel.style.height = "1px";

      this._sentinel = this._controllerContainer.appendChild(sentinel);

      this.initScrollObserver();
    }

    if (this.controls === "button") {
      this._button = this._controllerContainer.appendChild(
        document.createElement("button"),
      );

      this._button.textContent = "Több betöltése";
      this._button.addEventListener("click", this.loadMore);
    }

    if (this.controls === "pagination") {
      this._paginationControls = this._controllerContainer.appendChild(
        document.createElement("pagination-controls"),
      );
      this.addEventListener("page-request", this.onPageRequest);
    }

    this._built = true;

    this.applyDeferredAttributes();
  }

  applyDeferredAttributes() {
    for (const [name, value] of this._deferredAttributes) {
      this.attributeChangedCallback(name, null, value);
    }

    this._deferredAttributes.clear();
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

  showPage(page) {
    this._page = page;

    if (!this._byPage.has(page)) {
      this._container.textContent = "";
      this.loadNextPage();

      return;
    }

    const nodes = this._byPage.get(page);
    if (!nodes) return;

    this._container.textContent = "";

    for (const node of nodes) {
      this._container.appendChild(node);
    }
  }

  onPageRequest(e) {
    const page = e.detail?.page;
    if (!page) return;

    if (this._loading) return;

    this.showPage(page);
    e.detail?.onDone?.();
  }

  async loadMore(e) {
    const button = e.target;
    if (!button) return;

    button.disabled = true;

    await this.loadNextPage();

    if (this._hasNext) {
      button.disabled = false;
    }
  }

  onLoadFinish() {
    if (!this._hasNext && this._button) {
      this._button.disabled = true;
    }

    if (this._paginationControls) {
      const totalItems = this.extractTotal(this._lastResponse);
      const totalPages = Math.ceil(totalItems / this.pageSize);
      this._paginationControls.setAttribute("total", totalPages);
    }
  }

  async loadNextPage() {
    if (
      (!this.src && !this.hasAttribute("local")) ||
      this._loading ||
      (!this._hasNext && this.controls !== "pagination")
    ) {
      return;
    }

    const token = Symbol();
    this._activeLoadToken = token;

    this._loading = true;

    try {
      const response = await this.getResponse();
      if (this._activeLoadToken !== token) {
        return;
      }

      this._lastResponse = response;

      if (!this.isValidResponse(response)) {
        throw new Error("Request failed");
      }

      const items = this.extractItems(response);

      this.renderContent(items, response);

      if (this.controls !== "pagination") {
        this._page += 1;
      }
      this._hasNext = this.extractHasNext(response);

      if (this.controls === "scroll") {
        this.reobserve();
      }
    } catch (error) {
      // console.error(error);
      console.error(error.message);
    } finally {
      // this._loading = false;
      // this.onLoadFinish();
      if (this._activeLoadToken === token) {
        this._loading = false;
        this.onLoadFinish();
      }
    }
  }

  save(node) {
    if (this.controls !== "pagination") return;

    if (!this._byPage.has(this._page)) {
      this._byPage.set(this._page, new Set());
    }

    this._byPage.get(this._page).add(node);

    this.clearPages();
  }

  clearPages(all = false) {
    if (all) {
      this._byPage.clear();
      return;
    }

    if (!this._cacheLimit) return;

    const pages = Array.from(this._byPage.keys());

    const half = Math.floor(this._cacheLimit / 2);
    const minPage = Math.max(1, this._page - half);
    const maxPage = this._page + half;

    for (const page of pages) {
      if (page < minPage || page > maxPage) {
        const nodes = this._byPage.get(page);
        nodes?.forEach((node) => {
          this.onNodeDeletion(node);
          node.remove();
        });
        this._byPage.delete(page);
      }
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
        this.save(node);
        this._container.appendChild(node);
      }
    }
  }

  /** Override in subclass */
  onNodeDeletion(node) {
    return node;
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

  /** Override in subclass */
  extractTotal(response) {
    return response?.result?.total;
  }

  async reloadCurrentPage() {
    if (this.controls !== "pagination") return;

    this.clearPages(true);
    this._container.textContent = "";
    await this.loadNextPage();

    // if current page is beyond total pages go to the last valid page
    const totalItems = this.extractTotal(this._lastResponse);
    const totalPages =
      totalItems > 0 ? Math.ceil(totalItems / this.pageSize) : 1;

    if (this._page > totalPages) {
      this._page = totalPages;
      this.clearPages(true);
      this._container.textContent = "";
      await this.loadNextPage();
    }
  }

  reset() {
    if (!this._built) {
      this.build();
    }

    this._page = 1;
    this._loading = false;
    this._hasNext = true;
    this._lastResponse = null;
    this.clearPages(true);

    if (this.controls === "pagination") {
      this._paginationControls.setAttribute("total", "1");
    }

    this._container.textContent = "";
  }

  partialRefresh() {
    if (this.controls === "pagination") {
      this.reloadCurrentPage();
    } else {
      this.refresh();
    }
  }

  refresh() {
    this.reset();
    this.loadNextPage();
  }

  getURL() {
    return new URL(this.src, window.location.origin);
  }

  async getResponse() {
    const url = this.getURL();

    url.searchParams.set("page", this._page);
    url.searchParams.set("limit", this.pageSize);

    return await this.executeRequest(url);
  }
}

window.customElements.define("lazy-item-list", LazyItemList);
