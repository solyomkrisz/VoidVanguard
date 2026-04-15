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
      })
    );

    this._elements.submitButton.disabled = true;
  }

  enable() {
    this._elements.submitButton.disabled = false;
  }

  build() {
    if (this._built) return;

    this.setShadowInnerHTML(`
        <form>
            <input-group>
                <label>Mentés neve</label>
                <input type="text" name="slotName" />
            </input-group>
            <button>Mentése</button>
        </form>
    `);

    this._elements.submitButton = this.queryShadowSelector("button");
    this._elements.form = this.queryShadowSelector("form");
    this._elements.form.addEventListener("submit", this.onSubmit);

    this._built = true;
  }
}

window.customElements.define("save-form", SaveForm);
