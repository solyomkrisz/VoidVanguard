import ContextConsumerElement from "/ui/component/core/ContextConsumerElement.js";
import _ from "/ui/component/form/InputGroup.js";
import _1 from "/ui/component/form/SmartFormWrapper.js";
import { dir } from "/ui/UI.js";
import { path } from "/common/common.js";
import State from "/state/State.js";

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

export default class FriendshipControlButton extends ContextConsumerElement {
  constructor() {
    super([path.join(dir, "global.css")]);
  }

  connectedCallback() {
    if (this._initialized) return;

    this.build();
    this.connect();

    this._initialized = true;
  }

  build() {
    this.setShadowInnerHTML(`
      <smart-form-wrapper url="/api/friends/" target="remote-state-provider">
        <form>
          <input type="hidden" name="userId" />
          <button>Barát hozzáadása</button>
        </form>
      </smart-form-wrapper>
    `);
  }

  // prettier-ignore
  subscribe(state) {
    const smartFormWrapper = this.queryShadowSelector("smart-form-wrapper"),
          input            = this.queryShadowSelector("input"),
          button           = this.queryShadowSelector("button");

    state.sub("user_id", (_, value) => input.value = value);

    State.multiSubscribe(
      [(a) => state.sub("friendship_status", a), (a) => state.sub("is_blocked", a)],
      (friendshipStatus, isBlocked) => {
        if (isBlocked) return; // ProfileHeader hides it so no point in updating it

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

window.customElements.define(
  "friendship-control-button",
  FriendshipControlButton,
);
