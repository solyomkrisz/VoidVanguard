import { isLoggedIn, isUserSet } from "/common/common.js";
import FormRestorer from "/ui/component/form/FormRestorer.js";
import "/ui/component/account/AccountForm.js";

export default class AccountFormRestorer extends FormRestorer {
  // key in object from server: form input name
  static mapping = {
    username: "username",
    role: "role",
    email: "email",
  };

  connectedCallback() {
    super.connectedCallback?.();

    const userId = window?.VoidVanguard?.user?.id;
    if (isLoggedIn() && isUserSet() && this.hasAttribute("auto") && userId) {
      this.setAttribute("user-id", userId);
    }
  }

  getEndpoint() {
    return "/api/users/" + this.getAttribute("user-id");
  }
}

window.customElements.define("account-form-restorer", AccountFormRestorer);
