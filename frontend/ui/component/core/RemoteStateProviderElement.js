import BaseCustomElement from "./BaseCustomElement.js";
import _1 from "/ui/component/profile/ProfileHeader.js";
import _ from "/ui/component/profile/FriendshipControlButton.js";
import * as net from "/common/network.js";
import userState from "/state/user.js";
import State from "/state/State.js";

export default class RemoteStateProviderElement extends BaseCustomElement {
  static get observedAttributes() {
    return ["src"];
  }

  get src() {
    return this.getAttribute("src");
  }

  set src(value) {
    this.setAttribute("src", value);
    this.load();
  }

  constructor() {
    super();
    this.state = new State();
  }

  async load() {
    if (!this.src) return;

    try {
      const response = await net.send(this.src);

      if (response?.success) {
        this.state.from(response.result);
      }
    } catch {
      return;
    }
  }

  connectedCallback() {
    if (this._initialized) return;

    this.setShadowInnerHTML("<slot></slot>");

    this._initialized = true;
  }

  onResponse(response) {
    if (!response || !response?.success) return;

    this.load();
  }
}

window.customElements.define(
  "remote-state-provider",
  RemoteStateProviderElement,
);
