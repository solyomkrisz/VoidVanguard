import BaseCustomElement from "/ui/component/BaseCustomElement.js";
import _ from "/ui/component/FriendshipControlButton.js";
import { dir, element, text } from "/ui/UI.js";
import { path } from "/common/common.js";
import * as net from "/common/network.js";
import userState from "/state/user.js";
import State from "/state/State.js";

export default class InputGroup extends BaseCustomElement {
  static get observedAttributes() {
    return ["input-type", "label", "input-placeholder", "options"];
  }

  get inputType() {
    return this.getAttribute("input-type");
  }

  set inputType(value) {
    this.setAttribute("input-type", value);
  }

  get label() {
    return this.getAttribute("label");
  }

  set label(value) {
    this.setAttribute("label", value);
  }

  get inputPlaceholder() {
    return this.getAttribute("input-placeholder");
  }

  set inputPlaceholder(value) {
    this.setAttribute("input-placeholder", value);
  }

  get options() {
    return this.getAttribute("options");
  }

  set options(value) {
    this.setAttribute("options", value);
  }

  constructor() {
    super([path.join(dir, "global.css"), path.join(dir, "inputGroup.css")]);
  }

  connectedCallback() {
    if (this._initialized) return;
    this.build();
    this._initialized = true;
  }

  build() {
    const id = "input-" + crypto.randomUUID();

    this.label && this.add(element("label", text(this.label)).attr("for", id));
    let input;

    if (this.inputType === "textarea") {
      input = this.add(element("textarea"));
    } else {
      input = this.add(element("input").attr("type", this.inputType));
    }

    input.attr("id", id);

    this.inputPlaceholder &&
      input.setAttribute("placeholder", this.inputPlaceholder);
  }
}

window.customElements.define("input-group", InputGroup);
