/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/ui/component/game/SaveForm.js
 * Szerep: Mentesi adatok bekero urlap.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import BaseCustomElement from "/ui/component/core/BaseCustomElement.js";
import "/ui/component/form/InputGroup.js";
import { dir } from "/ui/UI.js";
import { path, isLoggedIn } from "/common/common.js";
import { on, off } from "/common/eventhub.js";

export default class SaveForm extends BaseCustomElement {
  constructor() {
    super([path.join(dir, "global.css"), path.join(dir, "saveForm.css")]);

    this._elements = {};
    this._built = false;

    this.onSubmit = this.onSubmit.bind(this);
    this.onDone = this.onDone.bind(this);
    this.onLogin = this.onLogin.bind(this);
    this.onLogout = this.onLogout.bind(this);
  }

  onLogin(e) {
    if (!this._built) return;
    this._elements.selectInput.value = "remote";
  }

  onLogout(e) {
    if (!this._built) return;
    this._elements.selectInput.value = "local";
  }

  connectedCallback() {
    this.build();

    on("login", this.onLogin);
    on("logout", this.onLogout);

    this.dispatchEvent(
      new CustomEvent("save-form-connected", {
        detail: { form: this },
        bubbles: true,
        composed: true,
      })
    );
  }

  disconnectedCallback() {
    off("login", this.onLogin);
    off("logout", this.onLogout);
  }

  onSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);

    // <pause-menu> captures it
    this.dispatchEvent(
      new CustomEvent("save-request", {
        detail: { formData, onDone: this.onDone },
        bubbles: true,
        composed: true,
      })
    );

    this._elements.submitButton.disabled = true;
  }

  onDone(isSuccess, data) {
    if (!this._built) return;

    this._elements.submitButton.disabled = false;
  }

  build() {
    if (this._built) return;

    this.setShadowInnerHTML(`
        <form>
            <input-group>
                <label>Mentés neve</label>
                <input type="text" name="save_name" />
                <select name="save_type">
                  <option value="local">Helyi</option>
                  <option value="remote">Távoli</option>
                </select>
            </input-group>
            <button>Mentése</button>
        </form>
    `);

    this._elements.submitButton = this.queryShadowSelector("button");
    this._elements.saveNameInput = this.queryShadowSelector(
      "input[name='save_name']"
    );
    this._elements.selectInput = this.queryShadowSelector("select");
    this._elements.form = this.queryShadowSelector("form");
    this._elements.form.addEventListener("submit", this.onSubmit);

    if (isLoggedIn()) {
      this._elements.selectInput.value = "remote";
    }

    this._built = true;
  }

  from(data) {
    if (!this._built) return;

    if (!data || !data.game_id || !data.save_name) return;

    this._elements.saveNameInput.value = data.save_name;
  }

  reset() {
    if (!this._built) return;

    this._elements.gameIdInput.value = "";
    this._elements.saveNameInput.value = "";

    this._elements.form.reset();

    if (isLoggedIn()) {
      this._elements.selectInput.value = "remote";
    }
  }
}

window.customElements.define("save-form", SaveForm);
