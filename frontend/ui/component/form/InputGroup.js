/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/ui/component/form/InputGroup.js
 * Szerep: Label es input osszekapcsolasat vegzo kis urlap-wrapper.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
export default class InputGroup extends HTMLElement {
  constructor() {
    super();
    this._built = false;
  }

  connectedCallback() {
    if (this._built) return;
    this.build();
  }

  build() {
    const label = this.querySelector("label");
    const input = this.querySelector("input, textarea, select");

    if (!input) return;

    let id = input.id;

    if (!id && label) {
      // Ha az inputnak meg nincs id-ja, generalunk egyet, hogy a label kattinthatova valjon.
      id = "input-" + crypto.randomUUID();
      input.id = id;
    }

    if (label) {
      label.setAttribute("for", id);
    }

    this._built = true;
  }
}

window.customElements.define("input-group", InputGroup);
