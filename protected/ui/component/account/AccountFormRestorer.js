import FormRestorer from "/ui/component/form/FormRestorer.js";
import "/protected/ui/component/account/AccountForm.js";

export default class AccountFormRestorer extends FormRestorer {
  // key in object from server: form input name
  static mapping = {
    username: "username",
    role: "role",
    email: "email",
    gender: "gender",
  };

  getEndpoint() {
    return "/api/users/" + this.getAttribute("user-id");
  }
}

window.customElements.define("account-form-restorer", AccountFormRestorer);
