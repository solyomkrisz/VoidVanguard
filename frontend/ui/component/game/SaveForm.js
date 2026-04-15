import BaseCustomElement from "../core/BaseCustomElement.js";
import "../form/InputGroup.js";

export default class SaveForm extends BaseCustomElement {
  constructor() {
    super();

    this._elements = {};
    this._built = false;

    this.onSubmit = this.onSubmit.bind(this);
  }

  connectedCallback() {
    this.build();
  }

  onSubmit(e) {
    const formData = new FormData(e.target);

    this.dispatchEvent(
      new CustomEvent("save-request", {
        detail: { formData },
        bubbles: true,
        composed: true,
      }),
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
