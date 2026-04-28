// lekéri adott user-id attrib alapján a státuszt. ha nincs bannolva ban form megjelenítése, ha bannolva van akkor unban form
export default class BanForm extends HTMLElement {
  constructor() {
    super();

    this._built = false;
  }

  connectedCallback() {
    this.build();
  }

  build() {
    if (this._built) return;

    this._built = true;
  }
}

window.customElements.define("ban-form", BanForm);
