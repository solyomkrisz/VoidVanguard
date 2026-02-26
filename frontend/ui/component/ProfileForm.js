import BaseCustomElement from "/ui/component/BaseCustomElement.js";
import _ from "/ui/component/SmartFormWrapper.js";
import _1 from "/ui/component/InputGroup.js";
import { dir, element, text } from "/ui/UI.js";
import { path } from "/common/common.js";
import * as net from "/common/network.js";
import State from "/state/State.js";

const method = {
  update: "PATCH",
  create: "POST",
};

export default class ProfileForm extends BaseCustomElement {
  static get observedAttributes() {
    return ["action"];
  }

  get action() {
    return this.getAttribute("action");
  }

  set action(value) {
    this.setAttribute("action", value);
  }

  constructor() {
    super([path.join(dir, "global.css")]);
  }

  connectedCallback() {
    if (this._initialized) return;
    this.build();
    this._initialized = true;
  }

  build() {
    const form = element("form");

    form.appendChild(
      element("input-group")
        .attr("input-type", "text")
        .attr("label", "Profilnév")
        .attr("input-placeholder", "Név123"),
    );

    form.appendChild(
      element("input-group")
        .attr("input-type", "textarea")
        .attr("label", "Leírás")
        .attr("input-placeholder", "Ez a profilom..."),
    );

    form.appendChild(element("button", text("Módosítások mentése")));

    this.add(
      element("smart-form-wrapper", form)
        .attr("url", "/api/profiles")
        .attr("method", method[this.action]),
    );
  }

  onResponse(response) {
    console.log(response);
  }
}

window.customElements.define("profile-form", ProfileForm);
