import BaseCustomElement from "/ui/component/core/BaseCustomElement.js";
import _ from "/ui/component/form/SmartFormWrapper.js";
import _1 from "/ui/component/form/InputGroup.js";
import { dir } from "/ui/UI.js";
import { path } from "/common/common.js";

const method = {
  update: "PATCH",
  create: "POST",
};

export default class ProfileForm extends BaseCustomElement {
  static get observedAttributes() {
    return ["action"];
  }

  get action() {
    return this.getAttribute("action");
  }

  set action(value) {
    this.setAttribute("action", value);
    this.queryShadowSelector("smart-form-wrapper").method = method[this.action];
  }

  constructor() {
    super([path.join(dir, "global.css")]);
  }

  connectedCallback() {
    if (this._initialized) return;
    this.build();
    this._initialized = true;
  }

  build() {
    this.setShadowInnerHTML(`
      <smart-form-wrapper
        url="/api/profiles"
        method="${method[this.action]}"
        refresh-target="#profile"
        response-target="toast-manager"
        show-response-message
      >
        <form>
          <input-group
            input-type="text"
            label="Profilnév"
            input-placeholder="Név123"
            name="display_name"
          ></input-group>

          <input-group
            input-type="textarea"
            label="Leírás"
            input-placeholder="Ez a profilom..."
            name="description"
          ></input-group>
          
          <input-group
            input-type="select"
            label="Láthatóság"
            name="visibility"
            options="'Nyilvános'-'public','Csak barátok'-'friends-only'"
          ></input-group>

          <button>Módosítások mentése</button>
        </form>
      </smart-form-wrapper>  
    `);
  }

  onResponse(response) {
    console.log(response);
  }
}

window.customElements.define("profile-form", ProfileForm);
