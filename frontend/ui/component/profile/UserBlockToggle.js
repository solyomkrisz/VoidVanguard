import _ from "/ui/component/form/InputGroup.js";
import _1 from "/ui/component/form/SmartFormWrapper.js";
import { dir } from "/ui/UI.js";
import { path } from "/common/common.js";
import State from "/state/State.js";
import userState from "/state/user.js";

export default class UserBlockToggle extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    if (this._initialized) return;
    this.build();
    this._initialized = true;
  }

  build() {
    this.innerHTML = `
      <smart-form-wrapper
        url="/api/blocks/"
        refresh-target="${this.getAttribute("refresh-target")}"
        response-target="${this.getAttribute("response-target")}"
      >
        <form>
          <input type="hidden" name="userId" />
          <button></button>
        </form>
      </smart-form-wrapper>
    `;
  }

  // prettier-ignore
  subscribe(state) {
    const smartFormWrapper = this.querySelector("smart-form-wrapper"),
          input            = this.querySelector("input"),
          button           = this.querySelector("button");

    state.sub("user_id", (_, value) => input.value = value);

    State.multiSubscribe(
      [(a) => userState.sub("id", a), (a) => state.sub("user_id", a)],
      (uid, pid) => { this.hidden = !(uid && uid !== pid); }
    );

    state.sub("is_blocked", (_, value) => {
      if (value) {
        smartFormWrapper.method = "DELETE";
        button.textContent = "Felhasználó tiltásának feloldása";
        return;
      }

      smartFormWrapper.method = "POST";
      button.textContent = "Felhasználó letiltása";
    });
  }
}

window.customElements.define("user-block-toggle", UserBlockToggle);
