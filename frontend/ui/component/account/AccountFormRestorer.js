import { isLoggedIn, isUserSet } from "/common/common.js";
import FormRestorer from "/ui/component/form/FormRestorer.js";
import "/ui/component/account/AccountForm.js";

export default class AccountFormRestorer extends FormRestorer {
  // key in object from server: form input name
  static mapping = {
    username: "username",
    role: "role",
    email: "email",
    gender: "gender",
  };

  connectedCallback() {
    super.connectedCallback?.();

    if (isLoggedIn() && isUserSet() && this.hasAttribute("auto")) {
      this.setAttribute("user-id", window.VoidVanguard.user.id);
    }
  }

  getEndpoint() {
    return "/api/users/" + this.getAttribute("user-id");
  }
}

window.customElements.define("account-form-restorer", AccountFormRestorer);
