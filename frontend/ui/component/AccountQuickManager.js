import { dir, element, text } from "../UI.js";
import { path } from "../../common/common.js";
import BaseCustomElement from "./BaseCustomElement.js";
import _ from "./LogoutButton.js";
import userState from "../../state/user.js";

export default class AccountQuickManager extends BaseCustomElement {
  constructor() {
    super([
      path.join(dir, "global.css"),
      path.join(dir, "accountQuickManager.css"),
    ]);

    this.elements = {};

    this.build();
  }

  build() {
    const username = this.add(element("span", text("Logged out")));
    const logoutButton = this.add(
      element("logout-button").styl("display", "none"),
    );

    // prettier-ignore
    {
      userState.sub("username", (_, value) => {
        username.textContent = value || "Logged out";

        if (value) logoutButton.styl("display", "block");
        else logoutButton.styl("display", "none");
      });
    }
  }
}

window.customElements.define("account-quick-manager", AccountQuickManager);
