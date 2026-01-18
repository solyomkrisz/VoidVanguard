import * as UI from "../UI.js";
import _ from "./InputGroup.js";

export default class RegisterForm extends HTMLElement {
  constructor() {
    super();

    this.shadowDOM = this.attachShadow({ mode: "open" });

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`
      :host form {
        display:flex;
        flex-direction:column;
        align-items:center;
      }
    `);
    this.shadowDOM.adoptedStyleSheets = [sheet];
  }

  connectedCallback() {
    const form = this.shadowDOM.appendChild(UI.element("form"));
    form.appendChild(
      UI.element("input-group").add(
        "Felhasználónév",
        "text",
        "registerUsername",
      ),
    );
    form.appendChild(
      UI.element("input-group").add("Jelszó", "password", "registerPassword"),
    );

    form.appendChild(
      UI.element("input-group").add(
        "Jelszó megerősítése",
        "password",
        "registerConfirmPassword",
      ),
    );

    form.appendChild(
      UI.element("input-group").add("Nem", "radio", "registerGender", {
        male: "Férfi",
        female: "Nő",
      }),
    );

    const button = form.appendChild(
      UI.element("button", UI.text("Regisztráció")),
    );

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const formData = new FormData(e.submitter.form);
      this.remove();
    });
  }
}

window.customElements.define("register-form", RegisterForm);
