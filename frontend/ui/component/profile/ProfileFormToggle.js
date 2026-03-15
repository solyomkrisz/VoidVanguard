import BaseCustomElement from "/ui/component/core/BaseCustomElement.js";
import _ from "/ui/component/button/ToggleButton.js";
import { dir } from "/ui/UI.js";
import { path } from "/common/common.js";
import userState from "/state/user.js";
import State from "/state/State.js";

export default class ProfileFormToggle extends BaseCustomElement {
  constructor() {
    super([path.join(dir, "global.css"), path.join(dir, "profile.css")]);
  }

  connectedCallback() {
    if (this._initialized) return;

    this.build();

    this._initialized = true;
  }

  build() {
    this.setShadowInnerHTML(`
        <toggle-button target="#modifyProfile" hidden>
            <button>Profil szerkesztése</button>
        </toggle-button>
    `);
  }

  // prettier-ignore
  subscribe(state) {
    const button = this.queryShadowSelector("toggle-button");
    State.multiSubscribe(
      [(a) => userState.sub("id", a), (a) => state.sub("user_id", a)],
      (uid, pid) => (button.hidden = !(uid && uid === pid))
    );
  }
}

window.customElements.define("profile-form-toggle", ProfileFormToggle);
