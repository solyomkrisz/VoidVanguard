import * as UI from "../UI.js";

export default class InputGroup extends HTMLElement {
  constructor() {
    super();
    this.shadowDOM = this.attachShadow({ mode: "open" });
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`
        :host{
            display:flex;
            flex-direction:column;
            color:white;
        }
    `);
    this.shadowDOM.adoptedStyleSheets = [sheet];
  }
  addElement(element) {
    this.shadowDOM.appendChild(element);
  }

  add(labelText, type, name, options = {}) {
    if (type === "radio") {
      this.shadowDOM.appendChild(UI.element("div", UI.text(labelText)));
      const radiogroup = this.shadowDOM.appendChild(UI.element("div"));

      let id = 0;

      for (const key of Object.keys(options)) {
        radiogroup.appendChild(
          UI.element("input")
            .attr("type", type)
            .attr("value", key)
            .attr("name", name)
            .attr("id", `${name}_${id++}`),
        );
        radiogroup.appendChild(
          UI.element("label", UI.text(options[key])).attr(
            "for",
            `${name}_${id}`,
          ),
        );
      }
      return this;
    }
    this.shadowDOM.appendChild(
      UI.element("label", UI.text(labelText)).attr("for", name),
    );
    this.shadowDOM.appendChild(
      UI.element("input")
        .attr("type", type)
        .attr("name", name)
        .attr("id", name),
    );
    return this;
  }
}

window.customElements.define("input-group", InputGroup);
