/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/ui/component/account/AccountFormRestorer.js
 * Szerep: A fiokurlap mezoihez tartozo felhasznaloi adatokat tolti vissza az API-bol.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import { isLoggedIn, isUserSet } from "/common/common.js";
import FormRestorer from "/ui/component/form/FormRestorer.js";
import "/ui/component/account/AccountForm.js";

export default class AccountFormRestorer extends FormRestorer {
  // Szerver-mezo -> form mezonev megfeleltetes.
  static mapping = {
    username: "username",
    role: "role",
    email: "email",
  };

  connectedCallback() {
    super.connectedCallback?.();

    const userId = window?.VoidVanguard?.user?.id;
    // Auto modban mindig az aktualisan bejelentkezett felhasznalo adatait kerjuk le.
    if (isLoggedIn() && isUserSet() && this.hasAttribute("auto") && userId) {
      this.setAttribute("user-id", userId);
    }
  }

  getEndpoint() {
    return "/api/users/" + this.getAttribute("user-id");
  }
}

window.customElements.define("account-form-restorer", AccountFormRestorer);
