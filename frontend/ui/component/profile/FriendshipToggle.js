import _ from "/ui/component/form/InputGroup.js";
import _1 from "/ui/component/form/SmartFormWrapper.js";
import State from "/state/State.js";
import userState from "/state/user.js";

export default class FriendshipToggle extends HTMLElement {
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
        url="/api/friends/"
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

        switch (friendshipStatus) {
          case "sent":
            smartFormWrapper.method = "DELETE";
            button.textContent = "Barátkérelem visszavonása";
            break;
          case "received":
            smartFormWrapper.method = "PATCH";
            button.textContent = "Barátkérelem elfogadása";
            break;
          case "accepted":
            smartFormWrapper.method = "DELETE";
            button.textContent = "Barát eltávolítása";
            break;
          default:
            smartFormWrapper.method = "POST";
            button.textContent = "Barát hozzáadása";
        }
      }
    );
  }
}

window.customElements.define("friendship-toggle", FriendshipToggle);
