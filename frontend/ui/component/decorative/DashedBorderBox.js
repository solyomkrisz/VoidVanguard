import BaseCustomElement from "/ui/component/core/BaseCustomElement.js";
import { dir } from "/ui/UI.js";
import { path } from "/common/common.js";

export default class DashedBorderBox extends BaseCustomElement {
  constructor() {
    super([
      path.join(dir, "global.css"),
      path.join(dir, "dashedBorderBox.css"),
    ]);

    this._stylesLoaded.then(() => {
      this.setShadowInnerHTML(`
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <rect x="0" y="0" width="100" height="100"></rect>
        </svg>
        <slot></slot>
      `);
    });

    // this.setShadowInnerHTML("<slot></slot>");
    // this.createSVG();
  }

  // createSVG() {
  //   const template = document.querySelector("#dashed-box-template");
  //   if (!template) return;

  //   const clone = template.content.cloneNode(true);
  //   const svg = clone.querySelector("svg");
  //   const rect = svg.querySelector("rect");

  //   this.shadowRoot.prepend(svg);
  // }

  // createSVG() {
  //   const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  //   svg.setAttribute("viewBox", "0 0 100 100");
  //   svg.setAttribute("preserveAspectRatio", "none");
  //   svg.style.position = "absolute";
  //   svg.style.inset = "0";
  //   svg.style.width = "100%";
  //   svg.style.height = "100%";
  //   svg.style.pointerEvents = "none";
  //   svg.style.opacity = "0";
  //   svg.transition = "opacity 0.1s ease, transform 0.2s ease";

  //   const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  //   rect.setAttribute("x", "0");
  //   rect.setAttribute("y", "0");
  //   rect.setAttribute("width", "100");
  //   rect.setAttribute("height", "100");
  //   rect.setAttribute("fill", "none");
  //   rect.setAttribute("stroke", "#333");
  //   rect.setAttribute("stroke-width", "4");
  //   rect.setAttribute("vector-effect", "non-scaling-stroke");
  //   rect.setAttribute("stroke-dasharray", "10 5");
  //   rect.style.animation = "dash 1s linear infinite";
  //   rect.style.animationPlayState = "paused";

  //   svg.appendChild(rect);
  //   this.shadowRoot.prepend(svg);

  //   this.addEventListener("mouseenter", () => {
  //     svg.style.opacity = "1";
  //     rect.style.animationPlayState = "running";
  //   });

  //   this.addEventListener("mouseleave", () => {
  //     svg.style.opacity = "0";
  //     rect.style.animationPlayState = "paused";
  //   });
  // }
}

window.customElements.define("dashed-border-box", DashedBorderBox);
