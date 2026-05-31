/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/ui/component/profile/ProfileForm.js
 * Szerep: Profil szerkeszto urlap mezokkel es mentesi folyamattal.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
import "/ui/component/form/InputGroup.js";
import "/ui/component/validator/DisplayNameInputValidator.js";
import "/ui/component/validator/DescriptionInputValidator.js";
import BaseCustomElement from "/ui/component/core/BaseCustomElement.js";
import * as net from "/common/network.js";
import { setFieldValue } from "/common/common.js";
import { dir } from "/ui/UI.js";
import { path } from "/common/common.js";
import NetworkErrorHandler from "/common/NetworkErrorHandler.js";
import ToastManager from "/ui/component/feedback/ToastManager.js";

const METHOD = {
  create: "POST",
  update: "PATCH",
};

export default class ProfileForm extends BaseCustomElement {
  // Az action valtozasat attribute-ben is tarolja, majd a gombszoveget is frissiti.
  set action(value) {
    const oldValue = this.getAttribute("action");

    if (value !== oldValue) {
      this.setAttribute("action", value);
      this.update();
    }
  }

  // Visszaadja, hogy create vagy update modban mukodik-e az urlap.
  get action() {
    return this.getAttribute("action");
  }

  // Admin modban a submit nem kuld egybol kérést, hanem alairasi folyamaton megy at.
  get admin() {
    return this.hasAttribute("admin");
  }

  // Onmaga nevében vagy masik user neveben tortenik-e a signolas.
  get selfSign() {
    return this.hasAttribute("self-sign");
  }

  // Elokesziti az urlaphoz tartozo esemenykezeloket.
  constructor() {
    super([path.join(dir, "global.css"), path.join(dir, "profileForm.css")]);

    this._elements = {};
    this._built = false;

    this.onSubmit = this.onSubmit.bind(this);
    this.restoreFrom = this.restoreFrom.bind(this);
    this.resetForm = this.resetForm.bind(this);
  }

  // Elso csatlakozaskor epiti fel a shadow DOM-ot.
  connectedCallback() {
    if (this._built) return;
    this.build();
  }

  // A submitet admin es normal mod kozott szetvalasztva kezeli.
  async onSubmit(e) {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    /** Needed to be compatible with <admin-module> */
    if (this.admin) {
      if (this.selfSign) {
        const targetUserId =
          this.closest("full-profile")?.getAttribute("user-id");
        if (!targetUserId) return;

        formData.append("targetUserId", targetUserId);
        this.sendRequest(formData);

        return;
      }

      this.dispatchEvent(
        new CustomEvent("sign-request", {
          detail: { formData },
          bubbles: true,
          composed: true,
        }),
      );

      return;
    }

    this.sendRequest(formData);
  }

  // A profil API fele elkuldi a megfelelo create/update kérést.
  async sendRequest(formData) {
    const response = await net.send("/api/profiles", {
      method: METHOD[this.action] || "POST",
      body: formData,
    });

    this.onResponse(response);
  }

  // A szervervalasz alapjan hibat kezel vagy sikeres profil-esemenyt bocsat ki.
  onResponse(response) {
    const performedAction = this.action;

    if (
      NetworkErrorHandler.handle(response, {
        context: "ProfileForm.onResponse",
      })
    ) {
      return;
    }

    if (performedAction === "create") {
      this.action = "update";
    }

    ToastManager.SUCCESS(
      response?.message ||
        (performedAction === "update"
          ? "Profil sikeresen módosítva"
          : "Profil sikeresen létrehozva"),
    );

    this.dispatchEvent(
      new CustomEvent(this.getEventName(performedAction), {
        detail: { result: response?.result },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /** Needed to be compatible with <admin-module> */
  // Az admin-modul sikeres alairasa utan ugyanazt a kerest inditja el, mint a normal submit.
  onSignSuccess(data) {
    this.sendRequest(data.formData);
  }

  /** Needed to be compatible with <admin-module> */
  // Az admin-alairasi hibat felhasznalobarat modon jelzi.
  onSignError() {
    console.error("Unable to send signed data");
    ToastManager.ERROR("Nem sikerült az adatok aláíratása");
  }

  // A teljes profilurlap DOM-jat letrehozza, es az alap eventeket bekoti.
  update() {
    const elements = this._elements;
    const button = elements.button;
    if (button) {
      button.textContent = this.updateButtonText();
    }
  }

  // Felépiti a mezoket, az alapertelmezett profilnevet es a restore/reset hookokat.
  build() {
    this.setShadowInnerHTML(`
      <form>
        <input-group class="input-group">
          <label>Profilkép választó</label>
          <div class="avatar-picker-shell">
            <p class="avatar-picker-note">Válassz egy alap profilképet:</p>
            <div class="avatar-picker-grid">
              <label class="avatar-option">
                <input type="radio" name="avatar" value="/image/defaultPfp.png" checked />
                <img src="/image/defaultPfp.png" alt="Alap profilkép 1" draggable="false" />
              </label>
              <label class="avatar-option">
                <input type="radio" name="avatar" value="/image/defaultPfp2.png" />
                <img src="/image/defaultPfp2.png" alt="Alap profilkép 2" draggable="false" />
              </label>
              <label class="avatar-option">
                <input type="radio" name="avatar" value="/image/defaultPfp3.png" />
                <img src="/image/defaultPfp3.png" alt="Alap profilkép 3" draggable="false" />
              </label>
              <label class="avatar-option">
                <input type="radio" name="avatar" value="/image/defaultPfp4.png" />
                <img src="/image/defaultPfp4.png" alt="Alap profilkép 4" draggable="false" />
              </label>
              <label class="avatar-option">
                <input type="radio" name="avatar" value="/image/defaultPfp5.png" />
                <img src="/image/defaultPfp5.png" alt="Alap profilkép 5" draggable="false" />
              </label>
              <label class="avatar-option">
                <input type="radio" name="avatar" value="/image/defaultPfp6.png" />
                <img src="/image/defaultPfp6.png" alt="Alap profilkép 6" draggable="false" />
              </label>
            </div>
          </div>
        </input-group>

        <input-group class="input-group">
          <label>Profilnév</label>
          <display-name-input-validator>
            <input type="text" name="display_name" placeholder="Név123" />
          </display-name-input-validator>
        </input-group>

        <input-group class="input-group">
          <label>Leírás</label>
          <description-input-validator>
            <textarea name="description" placeholder="Ide írd a profilod leírását"></textarea>
          </description-input-validator>
        </input-group>
        
        <input-group class="input-group">
          <label>Láthatóság</label>
          <select name="visibility">
            <option value="public">Nyilvános</option>
            <option value="friends-only">Csak barátok</option>
          </select>
        </input-group>

        <button>Profil létrehozása</button>
      </form>
    `);

    const form = this.queryShadowSelector("form");
    form.addEventListener("submit", this.onSubmit);

    this._elements.form = form;
    this._elements.button = this.queryShadowSelector("button");

    const displayNameField = form.elements.namedItem("display_name");
    if (
      !this.admin /* new -> admin oldalon ne töltse ki*/ &&
      this.action !== "update" &&
      displayNameField &&
      !displayNameField.value
    ) {
      const username = window.VoidVanguard?.user?.username || "";
      if (username) {
        displayNameField.value = username;
      }
    }

    this.addEventListener("restore", this.restoreFrom);
    this.addEventListener("reset", this.resetForm);

    this._built = true;
  }

  // Kulso restore esemenybol visszatolti a profilurlap mezőit.
  restoreFrom(e) {
    const data = e.detail?.data;
    const form = this.queryShadowSelector("form");

    data && (this.action = "update");

    for (const [name, value] of Object.entries(data)) {
      const field = form.elements.namedItem(name);
      if (!field) continue;

      setFieldValue(field, value);
    }
  }

  // Alaphelyzetbe allitja a teljes formot.
  resetForm() {
    this._elements.form?.reset?.();
  }

  // A sikeres muvelethez illo custom event nevét adja vissza.
  getEventName(action = this.action) {
    switch (action) {
      case "update":
        return "profile-update";
      case "create":
      default:
        return "profile-create";
    }
  }

  // A kuldo gomb feliratat az aktualis modnak megfeleloen szamolja ki.
  updateButtonText() {
    switch (this.action) {
      case "update":
        return "Profil módosítása";
      case "create":
      default:
        return "Profil létrehozása";
    }
  }
}

window.customElements.define("profile-form", ProfileForm);
