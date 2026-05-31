/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/ui/component/admin/AdminAccountForm.js
 * Szerep: Admin altal szerkesztheto fiokadatok urlapja.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import "/ui/component/form/InputGroup.js";
import AccountForm from "/ui/component/account/AccountForm.js";

const _innerHTML = `
<form>
  <input-group class="input-group">
    <label>Felhasználónév</label>
    <username-input-validator can-be-empty>
      <input type="text" name="username" placeholder="Felhasználónév" />
    </username-input-validator>
  </input-group>

  <input-group class="input-group">
    <label>Email cím</label>
    <email-input-validator can-be-empty>
      <input type="email" name="email" placeholder="email@email.email" />
    </email-input-validator>
  </input-group>

  <input-group class="input-group">
    <label>Felhasználó jogosultsága</label>
    <select name="role">
      <option value="0">Felhasználó</option>
      <option value="1">Adminisztrátor</option>
    </select>
  </input-group>

  <div class="password-input-group">
    <input-group class="input-group">
      <label>Jelszó</label>
      <password-input-validator can-be-empty>
        <input type="password" name="password" placeholder="Jelszó" />
      </password-input-validator>
    </input-group>
    
    <input-group class="input-group">
      <label>Jelszó megerősítése</label>
      <password-input-validator can-be-empty>
        <input type="password" name="passwordConfirm" placeholder="Jelszó megerősítése" />
      </password-input-validator>
    </input-group>
  </div>

  <button id="admin-account-form-submit-button">Fiókadatok módosítása</button>
</form>
`;

export default class AdminAccountForm extends AccountForm {
  constructor() {
    super(["/ui/style/adminForm.css"]);
    this._innerHTML = _innerHTML;
  }
}

window.customElements.define("admin-account-form", AdminAccountForm);
