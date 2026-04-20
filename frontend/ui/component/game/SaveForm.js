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
  }

  disconnectedCallback() {
    off("login", this.onLogin);
    off("logout", this.onLogout);
  }

  onSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const type = this._elements.selectInput.value || "local";

    // <pause-menu> captures it
    this.dispatchEvent(
      new CustomEvent("save-request", {
        detail: { formData, type, onDone: this.onDone },
        bubbles: true,
        composed: true,
      }),
    );

    this._elements.submitButton.disabled = true;
  }

  onDone(isSuccess, data) {
    if (!this._built) return;

    this._elements.submitButton.disabled = false;

    if (isSuccess) {
      this.reset();
      this.dispatchEvent(
        new CustomEvent("save-success", {
          detail: data,
          bubbles: true,
          composed: true,
        }),
      );
    } else {
      this.dispatchEvent(
        new CustomEvent("save-failure", {
          detail: data,
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  build() {
    if (this._built) return;

    this.setShadowInnerHTML(`
        <form>
            <input-group>
                <label>Mentés neve</label>
                <input type="hidden" name="save_id" />
                <input type="text" name="slot_name" />
                <select>
                  <option value="local">Helyi</option>
                  <option value="remote">Távoli</option>
                </select>
                <input type="checkbox" name="rename_only" id="rename_only" />
                <label for="rename_only">Csak átnevezés</label>
            </input-group>
            <button>Mentése</button>
        </form>
    `);

    this._elements.submitButton = this.queryShadowSelector("button");
    this._elements.saveIdInput = this.queryShadowSelector(
      "input[name='save_id']",
    );
    this._elements.slotNameInput = this.queryShadowSelector(
      "input[name='slot_name']",
    );
    this._elements.selectInput = this.queryShadowSelector("select");
    this._elements.renameOnlyCheckbox = this.queryShadowSelector(
      "input[name='rename_only']",
    );
    this._elements.renameOnlyLabel = this.queryShadowSelector(
      "label[for='rename_only']",
    );
    this._elements.form = this.queryShadowSelector("form");
    this._elements.form.addEventListener("submit", this.onSubmit);

    this._elements.renameOnlyCheckbox.hidden = true;
    this._elements.renameOnlyLabel.hidden = true;

    if (isLoggedIn()) {
      this._elements.selectInput.value = "remote";
    }

    this._built = true;
  }

  from(data) {
    if (!this._built) return;

    if (!data || !data.id || !data.name) return;

    this._elements.saveIdInput.value = data.id;
    this._elements.slotNameInput.value = data.name;

    this._elements.renameOnlyCheckbox.hidden = false;
    this._elements.renameOnlyLabel.hidden = false;
  }

  reset() {
    if (!this._built) return;

    this._elements.saveIdInput.value = "";
    this._elements.slotNameInput.value = "";
    this._elements.renameOnlyCheckbox.checked = false;

    this._elements.renameOnlyCheckbox.hidden = true;
    this._elements.renameOnlyLabel.hidden = true;

    this._elements.form.reset();

    if (isLoggedIn()) {
      this._elements.selectInput.value = "remote";
    }
  }
}

window.customElements.define("save-form", SaveForm);
