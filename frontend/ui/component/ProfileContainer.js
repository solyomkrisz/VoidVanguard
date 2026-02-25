import BaseCustomElement from "/ui/component/BaseCustomElement.js";
import _1 from "/ui/component/ProfileHeader.js";
import _ from "/ui/component/FriendshipControlButton.js";
import { dir, element, text } from "/ui/UI.js";
import { path } from "/common/common.js";
import * as net from "/common/network.js";
import State from "/state/State.js";

export default class ProfileContainer extends BaseCustomElement {
  constructor() {
    super([
      path.join(dir, "global.css"),
      path.join(dir, "profileContainer.css"),
    ]);

    this.state = new State();

    this.build();
  }

  async load() {
    try {
      const id = window.location.pathname.split("/").filter(Boolean)[1];

      const response = await net.send("/api/profiles/" + id);

      response.success && this.state.from(response.result);
    } catch {
      return;
    }
  }

  async connectedCallback() {
    await this.load();
  }

  build() {
    // this.add("profile-header");
    this.add("slot");
  }
}

window.customElements.define("profile-container", ProfileContainer);
