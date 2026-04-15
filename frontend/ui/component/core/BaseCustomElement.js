export default class BaseCustomElement extends HTMLElement {
  static STYLE_CACHE = new Map();
  static PENDING_FETCHES = new Map();

  constructor(paths = []) {
    super();

    this.attachShadow({ mode: "open" });

    this._initialized = false;

    this._stylesLoaded = Promise.all(
      paths.map((path) => this._loadStyle(path)),
    ).then((sheets) => {
      // Apply styles in the correct order after all are loaded
      if (!this.isConnected) return;

      this.shadowRoot.adoptedStyleSheets = [
        ...this.shadowRoot.adoptedStyleSheets,
        ...sheets.filter(Boolean),
      ];
    });

    // for (const path of paths) {
    //   if (BaseCustomElement.STYLE_CACHE.has(path)) {
    //     // console.log(`BASECUSTOMELEMENT-constructor: Found in cache: ${path}`);
    //     this.shadowRoot.adoptedStyleSheets.push(
    //       BaseCustomElement.STYLE_CACHE.get(path),
    //     );
    //   } else if (BaseCustomElement.PENDING_FETCHES.has(path)) {
    //     // console.log(
    //     //   `BASECUSTOMELEMENT-constructor: Found a pending fetch for: ${path}`,
    //     // );

    //     BaseCustomElement.PENDING_FETCHES.get(path)?.then((sheet) => {
    //       if (!(sheet instanceof CSSStyleSheet)) return;

    //       if (!this.isConnected) return;

    //       this.shadowRoot.adoptedStyleSheets = [
    //         ...this.shadowRoot.adoptedStyleSheets,
    //         sheet,
    //       ];
    //     });
    //   } else {
    //     // console.log(
    //     //   `BASECUSTOMELEMENT-constructor: No ongoing fetch, starting a new one for: ${path}`,
    //     // );

    //     const promise = fetch(path)
    //       .then((response) => response.text())
    //       .then((css) => {
    //         const sheet = new CSSStyleSheet();
    //         sheet.replaceSync(css);

    //         BaseCustomElement.STYLE_CACHE.set(path, sheet);
    //         BaseCustomElement.PENDING_FETCHES.delete(path);

    //         this.shadowRoot.adoptedStyleSheets.push(sheet);

    //         return sheet;
    //       })
    //       .catch((error) => {
    //         console.error(error);
    //         BaseCustomElement.PENDING_FETCHES.delete(path);
    //       });

    //     BaseCustomElement.PENDING_FETCHES.set(path, promise);
    //   }
    // }
  }

  async _loadStyle(path) {
    if (BaseCustomElement.STYLE_CACHE.has(path)) {
      // console.log(`BASECUSTOMELEMENT-constructor: Found in cache: ${path}`);
      return BaseCustomElement.STYLE_CACHE.get(path);
    }

    if (BaseCustomElement.PENDING_FETCHES.has(path)) {
      // console.log(
      //   `BASECUSTOMELEMENT-constructor: Found a pending fetch for: ${path}`,
      // );
      return await BaseCustomElement.PENDING_FETCHES.get(path);
    }

    // console.log(
    //   `BASECUSTOMELEMENT-constructor: No ongoing fetch, starting a new one for: ${path}`,
    // );

    const promise = fetch(path)
      .then((response) => response.text())
      .then((css) => {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(css);

        BaseCustomElement.STYLE_CACHE.set(path, sheet);
        BaseCustomElement.PENDING_FETCHES.delete(path);

        return sheet;
      })
      .catch((error) => {
        console.error(error);
        BaseCustomElement.PENDING_FETCHES.delete(path);
        return null;
      });

    BaseCustomElement.PENDING_FETCHES.set(path, promise);
    return promise;
  }

  setShadowInnerHTML(string) {
    this.shadowRoot.innerHTML = string;
  }

  queryShadowSelector(selector) {
    return this.shadowRoot.querySelector(selector);
  }

  appendShadowChild(child) {
    return this.shadowRoot.appendChild(child);
  }

  clearShadow() {
    this.shadowRoot.textContent = "";
  }
}
