import * as net from "/common/network.js";

export default class FullProfile extends HTMLElement {
  static get observedAttributes() {
    return ["user-id"];
  }

  get userId() {
    return this.getAttribute("user-id");
  }

  set userId(value) {
    this.setAttribute("user-id", value);
  }

  constructor() {
    super();
    this.elements = {};
    this.profileData = {};
    this._rendered = false;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name !== "user-id" || oldValue === newValue) {
      return;
    }

    this.update();
  }

  connectedCallback() {
    this.render();

    if (this.userId) {
      this.update();
    }
  }

  render() {
    if (this._rendered) return;

    this.innerHTML = `
        <div class="profile-header">
            <img class="avatar" />
            <div>
                <div class="profile-name"></div>
                <div class="profile-description"></div>
            </div>
            <div class="profile-header-actions">
                <button class="friendship-control-button">Barát hozzáadása</button>
                <button class="block-control-button">Felhasználó letiltása</button>
            </div>
        </div>
    `;

    this.elements.avatar = this.querySelector(".avatar");
    this.elements.profileName = this.querySelector(".profile-name");
    this.elements.profileDescription = this.querySelector(
      ".profile-description",
    );
    this.elements.friendshipControlButton = this.querySelector(
      ".friendship-control-button",
    );
    this.elements.blockControlButton = this.querySelector(
      ".block-control-button",
    );

    this.elements.friendshipControlButton.addEventListener(
      "click",
      async () => {
        const formData = new FormData();
        formData.append("userId", this.userId);

        const response = await net.send("/api/friends", {
          method: "POST",
          body: formData,
        });

        if (!response.success) {
          console.error("Unable to modify friendship with user.");
          return;
        }

        const result = response.result;
      },
    );

    this.elements.blockControlButton.addEventListener("click", () => {});

    this._rendered = true;
  }

  updateFriendshipControlButton(friendshipStatus) {
    switch (friendshipStatus) {
      case "not-friends":
        this.elements.friendshipControlButton.textContent = "Barát hozzáadása";
        break;
      case "accepted":
        this.elements.friendshipControlButton.textContent =
          "Barát eltávolítása";
        break;
      case "pending":
        this.elements.friendshipControlButton.textContent =
          "Barátkérelem visszavonása";
        break;
      default:
        console.error("Unknown friendship status.");
        break;
    }
  }

  updateBlockButton(blockStatus) {
    switch (blockStatus) {
      case "you-blocked":
        this.elements.friendshipControlButton.hidden = false;
        this.elements.blockControlButton.textContent = "Letiltás feloldása";
        break;
      case "got-blocked":
        this.elements.friendshipControlButton.hidden = false;
        this.elements.blockControlButton.textContent = "Felhasználó letiltása";
        break;
      default:
        this.elements.friendshipControlButton.hidden = true;
        this.elements.blockControlButton.textContent = "Felhasználó letiltása";
        break;
    }
  }

  async update() {
    if (!this._rendered) {
      this.render();
    }

    const currentUserId = this.userId;

    const response = await net.send("/api/profiles/" + currentUserId);

    if (currentUserId !== this.userId) {
      return;
    }

    if (!response.success) {
      console.warn("Unable to fetch profile.");
      return;
    }

    this.profileData = response.result;
    console.log(this.profileData);
    const { avatar, profileName, profileDescription } = this.elements;

    avatar.src = this.profileData.avatar;
    profileName.textContent = this.profileData.display_name;
    profileDescription.textContent = this.profileData.description;

    this.updateFriendshipControlButton(this.profileData.friendship_status);
    this.updateBlockButton(this.profileData.is_blocked);
  }
}

window.customElements.define("full-profile", FullProfile);
