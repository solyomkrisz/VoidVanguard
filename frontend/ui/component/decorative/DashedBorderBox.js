import BaseCustomElement from "/ui/component/core/BaseCustomElement.js";
import { dir } from "/ui/UI.js";
import { path } from "/common/common.js";

export default class DashedBorderBox extends BaseCustomElement {
  constructor() {
    super([
      path.join(dir, "global.css"),
      path.join(dir, "dashedBorderBox.css"),
    ]);

    this.setShadowInnerHTML(`
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <rect x="0" y="0" width="100" height="100"></rect>
        </svg>
        <slot></slot>
    `);
  }
}

window.customElements.define("dashed-border-box", DashedBorderBox);
