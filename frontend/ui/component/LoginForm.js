import * as UI from "../UI.js";

export default class LoginForm extends HTMLElement {
  constructor() {
    super();

    this.shadowDOM = this.attachShadow({ mode: "open" });

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`
      :host {
        
      }
    `);
    this.shadowDOM.adoptedStyleSheets = [sheet];
  }

  connectedCallback() {

  }
}

window.customElements.define("login-form", LoginForm);
