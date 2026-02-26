import BaseCustomElement from "/ui/component/BaseCustomElement.js";
import _ from "/ui/component/FriendshipControlButton.js";
import { dir, element, text } from "/ui/UI.js";
import { path } from "/common/common.js";
import * as net from "/common/network.js";
import userState from "/state/user.js";
import State from "/state/State.js";

export default class ProfileHeader extends BaseCustomElement {
  constructor() {
    super([path.join(dir, "global.css"), path.join(dir, "profileHeader.css")]);

    this.elements = {};

    this.build();
  }

  connectedCallback() {
    window.queueMicrotask(() => {
      const state = this.closest("profile-container").state;
      const { avatar, displayName, description } = this.elements;

      state.sub("avatar", (_, value) => (avatar.src = value));
      state.sub("displayName", (_, value) => (displayName.textContent = value));
      state.sub("description", (_, value) => (description.textContent = value));
    });
  }

  // prettier-ignore
  build() {
    const e = this.elements;

    e.avatar = this.add(element("img"));
    e.displayName = element("div", text("Display Name"));
    e.description = element("div", text(""));
    this.add(element("div", e.displayName, e.description));

    const friendButton = this.add(element("friendship-control-button").styl("display", "none"));

    userState.sub("username", (_, value) => {
      if (value) friendButton.styl("display", "block");
      else friendButton.styl("display", "none");
    });
  }
}

window.customElements.define("profile-header", ProfileHeader);
