import BaseCustomElement from "./BaseCustomElement.js";
import _ from "./FriendshipControlButton.js";
import { dir, element, text } from "../UI.js";
import { path } from "../../common/common.js";
import * as net from "../../common/network.js";
import userState from "../../state/user.js";

export default class ProfileHeader extends BaseCustomElement {
  constructor() {
    super([path.join(dir, "global.css"), path.join(dir, "profileHeader.css")]);

    this.elements = {};
    this.source = null;

    this.build();
  }

  async load(id) {
    const result = await net.send("/api/profiles/" + id);
    if (result.success) this.source = result;
  }

  // prettier-ignore
  build() {
    this.elements.avatar = this.add("img");
    this.elements.displayName = element("div", text("Display Name"));
    this.elements.description = element("div", text(""));
    this.add("div", this.elements.displayName, this.elements.description);

    const friendButton = this.add("friendship-control-button").styl("display", "none");

    userState.sub("username", (_, value) => {
      if (value) friendButton.styl("display", "block");
      else friendButton.styl("display", "none");
    });
  }
}

window.customElements.define("profile-header", ProfileHeader);
