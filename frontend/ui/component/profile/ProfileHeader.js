import _ from "/ui/component/profile/FriendshipControlButton.js";
import _1 from "/ui/component/button/ToggleButton.js";
import ContextConsumerElement from "/ui/component/core/ContextConsumerElement.js";
import { dir, element, text } from "/ui/UI.js";
import { path } from "/common/common.js";
import userState from "/state/user.js";
import State from "/state/State.js";

export default class ProfileHeader extends ContextConsumerElement {
  constructor() {
    super([path.join(dir, "global.css"), path.join(dir, "profileHeader.css")]);
  }

  connectedCallback() {
    if (this._initialized) return;

    this.build();
    this.connect();

    this._initialized = true;
  }

  // prettier-ignore
  build() {
    this.setShadowInnerHTML(`
      <img src="" />
      <div>
        <div class="displayName">Display Name</div>
        <div class="description"></div>
      </div>
      <div>
        <friendship-control-button state-provider="remote-state-provider" hidden></friendship-control-button>
        <toggle-button target="fullscreen-overlay" hidden>
          <span>Profil szerkesztése</span>
        </toggle-button>
      </div>
    `);
  }

  // prettier-ignore
  subscribe(state) {
    const avatar       = this.queryShadowSelector("img"),
          displayName  = this.queryShadowSelector(".displayName"),
          description  = this.queryShadowSelector(".description"),
          friendButton = this.queryShadowSelector("friendship-control-button"),
          toggleButton = this.queryShadowSelector("toggle-button");

    state.sub("avatar", (_, value) => (avatar.src = value));
    state.sub("display_name", (_, value) => (displayName.textContent = value));
    state.sub("description", (_, value) => (description.textContent = value));

    State.multiSubscribe(
      [(a) => userState.sub("id", a), (a) => state.sub("user_id", a), (a) => state.sub("is_blocked", a)],
      (uid, pid, isBlocked) => {
        friendButton.hidden = !((uid && uid !== pid) && !isBlocked);
        toggleButton.hidden = !(uid && uid === pid);
      }
    );
  }
}

window.customElements.define("profile-header", ProfileHeader);
