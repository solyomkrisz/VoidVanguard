import { dir, element, text } from "../../UI.js";
import { path } from "../../../common/common.js";
import BaseCustomElement from "/ui/component/core/BaseCustomElement.js";
import _ from "/ui/component/auth/LogoutButton.js";
import userState from "../../../state/user.js";

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
    const username = this.appendShadowChild(
      element("span", text("Logged out")),
    );
    const logoutButton = this.appendShadowChild(
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
