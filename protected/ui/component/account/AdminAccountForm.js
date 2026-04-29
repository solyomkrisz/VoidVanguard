import "/ui/component/form/InputGroup.js";
import AccountForm from "/ui/component/account/AccountForm.js";

const _innerHTML = `
<form>
  <input-group class="input-group">
    <label>Felhasználónév</label>
    <input type="text" name="username" placeholder="Felhasználónév" />
  </input-group>

  <input-group class="input-group">
    <label>Email cím</label>
    <email-input-validator>
      <input type="email" name="email" placeholder="email@email.email" />
    </email-input-validator>
  </input-group>

  <input-group class="input-group">
    <select name="role">
      <option value="0">Felhasználó</option>
      <option value="1">Adminisztrátor</option>
    </select>
  </input-group>

  <input-group class="input-group">
    <label>Jelszó</label>
    <password-input-validator>
      <input type="password" name="password" placeholder="Jelszó" />
    </password-input-validator>
  </input-group>
  
  <input-group class="input-group">
    <label>Jelszó megerősítése</label>
    <password-input-validator>
      <input type="password" name="passwordConfirm" placeholder="Jelszó megerősítése" />
    </password-input-validator>
  </input-group>

  <button>Fiókadatok módosítása</button>
</form>
`;

export default class AdminAccountForm extends AccountForm {
  constructor() {
    super(["/protected/ui/style/adminForm.css"]);
    this._innerHTML = _innerHTML;
  }
}

window.customElements.define("admin-account-form", AdminAccountForm);
