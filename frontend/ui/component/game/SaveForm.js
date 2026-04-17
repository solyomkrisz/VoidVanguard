import BaseCustomElement from "/ui/component/core/BaseCustomElement.js";
import "/ui/component/form/InputGroup.js";
import { dir } from "/ui/UI.js";
import { path } from "/common/common.js";

export default class SaveForm extends BaseCustomElement {
  constructor() {
    super([path.join(dir, "global.css"), path.join(dir, "saveForm.css")]);

    this._elements = {};
    this._built = false;

    this.onSubmit = this.onSubmit.bind(this);
  }

  connectedCallback() {
    this.build();
  }

  onSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);

    this.dispatchEvent(
      new CustomEvent("save-request", {
        detail: { formData, onDone: () => this.enable() },
        bubbles: true,
        composed: true,
      }),
    );

    this._elements.submitButton.disabled = true;
  }

  enable() {
    if (!this._built) return;

    this._elements.submitButton.disabled = false;
    this.reset();
  }

  build() {
    if (this._built) return;

    this.setShadowInnerHTML(`
        <form>
            <input-group>
                <label>Mentés neve</label>
                <input type="hidden" name="save_id" />
                <input type="text" name="slot_name" />
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
    this._elements.form = this.queryShadowSelector("form");
    this._elements.form.addEventListener("submit", this.onSubmit);

    this._built = true;
  }

  from(data) {
    if (!this._built) return;

    if (!data || !data.id || !data.name) return;

    this._elements.saveIdInput.value = data.id;
    this._elements.slotNameInput.value = data.name;
  }

  reset() {
    if (!this._built) return;

    // this._elements.saveIdInput.value = "";
    // this._elements.slotNameInput.value = "";

    this._elements.form.reset();
  }
}

window.customElements.define("save-form", SaveForm);
