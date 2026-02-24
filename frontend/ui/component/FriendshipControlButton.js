import BaseCustomElement from "./BaseCustomElement.js";
import { element, text, dir } from "../UI.js";
import { path } from "../../common/common.js";

export default class FriendshipControlButton extends BaseCustomElement {
  constructor() {
    super([path.join(dir, "global.css")]);

    this.build();
  }

  build() {
    const button = element("button", text("Barát hozzáadása"));

    this.shadowRoot.appendChild(button);
  }
}

window.customElements.define(
  "friendship-control-button",
  FriendshipControlButton,
);
