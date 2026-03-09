export default class BaseCustomElement extends HTMLElement {
  static STYLE_CACHE = new Map();
  static PENDING_FETCHES = new Map();

  constructor(paths = []) {
    super();

    this.attachShadow({ mode: "open" });

    this._initialized = false;

    for (const path of paths) {
      if (BaseCustomElement.STYLE_CACHE.has(path)) {
        // console.log(`BASECUSTOMELEMENT-constructor: Found in cache: ${path}`);
        this.shadowRoot.adoptedStyleSheets.push(
          BaseCustomElement.STYLE_CACHE.get(path),
        );
      } else if (BaseCustomElement.PENDING_FETCHES.has(path)) {
        // console.log(
        //   `BASECUSTOMELEMENT-constructor: Found a pending fetch for: ${path}`,
        // );

        BaseCustomElement.PENDING_FETCHES.get(path).then((sheet) => {
          this.shadowRoot.adoptedStyleSheets.push(sheet);
        });
      } else {
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

            this.shadowRoot.adoptedStyleSheets.push(sheet);

            return sheet;
          })
          .catch((error) => {
            console.error(error);
            BaseCustomElement.PENDING_FETCHES.delete(path);
          });

        BaseCustomElement.PENDING_FETCHES.set(path, promise);
      }
    }
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
}
