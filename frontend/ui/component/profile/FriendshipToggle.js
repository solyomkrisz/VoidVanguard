import BaseCustomElement from "/ui/component/core/BaseCustomElement.js";
import _ from "/ui/component/form/InputGroup.js";
import _1 from "/ui/component/form/SmartFormWrapper.js";
import { dir } from "/ui/UI.js";
import { path } from "/common/common.js";
import State from "/state/State.js";
import userState from "/state/user.js";

function getButtonText(status) {
  switch (status) {
    case "pending":
      return "Barátkérelem visszavonása";
    case "accepted":
      return "Barát eltávolítása";
    default:
      return "";
  }
}

export default class FriendshipToggle extends BaseCustomElement {
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
      <smart-form-wrapper url="/api/friends/" refresh-target="remote-state-provider" response-target="toast-manager">
        <form>
          <input type="hidden" name="userId" />
          <button></button>
        </form>
      </smart-form-wrapper>
    `);
  }

  // prettier-ignore
  subscribe(state) {
    const smartFormWrapper = this.queryShadowSelector("smart-form-wrapper"),
          input            = this.queryShadowSelector("input"),
          button           = this.queryShadowSelector("button");

    state.sub("user_id", (_, value) => {
      value && (input.value = value);
    });

    State.multiSubscribe(
      [(a) => userState.sub("id", a), (a) => state.sub("user_id", a), (a) => state.sub("is_blocked", a)],
      (uid, pid, isBlocked) => {
        this.hidden = !((uid && uid !== pid) && !isBlocked);
      }
    );

    State.multiSubscribe(
      [(a) => state.sub("friendship_status", a), (a) => state.sub("is_blocked", a)],
      (friendshipStatus, isBlocked) => {
        if (this.hidden || isBlocked) return;

        if (friendshipStatus !== "not-friends") {
          smartFormWrapper.method = "DELETE";
          button.textContent = getButtonText(friendshipStatus);
          return;
        }

        smartFormWrapper.method = "POST";
        button.textContent = "Barát hozzáadása";
      }
    );
  }
}

window.customElements.define("friendship-toggle", FriendshipToggle);
