import "/ui/component/form/SmartForm.js";
import "/ui/component/form/InputGroup.js";
import BaseCustomElement from "/ui/component/core/BaseCustomElement.js";
import * as net from "/common/network.js";
import { dir } from "/ui/UI.js";
import { path } from "/common/common.js";

export default class ProfileForm extends BaseCustomElement {
  constructor() {
    super([path.join(dir, "global.css")]);

    this._built = false;
    this.onSubmit = this.onSubmit.bind(this);
  }

  connectedCallback() {
    if (this._built) return;
    this.build();
  }

  async onSubmit(e) {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    const response = await net.send("/api/profiles", {
      method: "POST",
      body: formData,
    });

    this.onResponse(response);
  }

  onResponse(response) {
    const { success, result, message } = response;

    if (!success) {
      console.error(message ?? "Failed to create profile.");
      return;
    }

    this.dispatchEvent(
      new CustomEvent("profile-create", {
        detail: { result },
        bubbles: true,
        composed: true,
      }),
    );
  }

  build() {
    this.setShadowInnerHTML(`
      <form>
        <input-group class="input-group">
          <label>Profilnév</label>
          <input type="text" name="display_name" placeholder="Név123" />
        </input-group>

        <input-group class="input-group">
          <label>Leírás</label>
          <textarea name="description" placeholder="Ez a profilom..."></textarea>
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

    this._built = true;
  }
}

window.customElements.define("profile-form", ProfileForm);
