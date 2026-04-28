import { el } from "/ui/UI.js";

function parseUserAgent(userAgent = "") {
  userAgent = userAgent.toLowerCase();

  let os = "Unknown";

  if (userAgent.includes("windows")) os = "Windows";
  else if (userAgent.includes("mac os")) os = "Mac";
  else if (userAgent.includes("iphone")) os = "iPhone";
  else if (userAgent.includes("ipad")) os = "iPad";
  else if (userAgent.includes("android")) os = "Android";
  else if (userAgent.includes("linux")) os = "Linux";

  let browser = "Unknown";

  if (userAgent.includes("chrome") && !userAgent.includes("edg"))
    browser = "Chrome";
  else if (userAgent.includes("safari") && !userAgent.includes("chrome"))
    browser = "Safari";
  else if (userAgent.includes("firefox")) browser = "Firefox";
  else if (userAgent.includes("edg")) browser = "Edge";

  return {
    os,
    browser,
    label: `${os} • ${browser}`,
  };
}

export default class TokenListItem extends HTMLElement {
  set data(value) {
    this._data = value;
    this.update();
  }

  get data() {
    return this._data;
  }

  constructor() {
    super();

    this._data = null;
    this._elements = {};
    this._built = false;

    this.onSessionDestroyButtonClick =
      this.onSessionDestroyButtonClick.bind(this);
  }

  onSessionDestroyButtonClick(e) {
    if (!this.data?.id) return;

    this.dispatchEvent(
      new CustomEvent("session-destroy", {
        detail: { id: this.data.id },
        bubbles: true,
        composed: true,
      }),
    );
  }

  connectedCallback() {
    this.build();
    this.update();
  }

  build() {
    if (this._built) return;

    this._elements.isCurrentMarker = el("div", {
      class: "is-current-marker",
      hidden: true,
    });
    this._elements.id = el("div");
    this._elements.destroyButton = el(
      "button",
      {
        onClick: this.onSessionDestroyButtonClick,
      },
      ["Munkamenet felfüggesztése"],
    );
    this._elements.issuedAt = el("div");
    this._elements.expiresAt = el("div");
    this._elements.main = el("div", { class: "token-list-item-main" }, [
      this._elements.isCurrentMarker,
      this._elements.id,
      this._elements.issuedAt,
      this._elements.expiresAt,
      this._elements.destroyButton,
    ]);

    this._elements.lastUsedAt = el("span");
    this._elements.lastUsedAtContainer = el("div", {}, [
      "Utoljára aktív: ",
      this._elements.lastUsedAt,
    ]);
    this._elements.ip = el("span");
    this._elements.ipContainer = el("div", {}, ["IP: ", this._elements.ip]);
    this._elements.userAgent = el("span");
    this._elements.userAgentContainer = el("div", {}, [
      "User Agent: ",
      this._elements.userAgent,
    ]);
    this._elements.dropdown = el(
      "div",
      { class: "token-list-item-dropdown", hidden: true },
      [
        this._elements.lastUsedAtContainer,
        this._elements.ipContainer,
        this._elements.userAgentContainer,
      ],
    );

    this.append(this._elements.main, this._elements.dropdown);

    this.addEventListener("click", (e) => {
      if (e.target === this._elements.destroyButton) return;
      this._elements.dropdown.hidden = !this._elements.dropdown.hidden;
    });

    this._built = true;
  }

  update() {
    if (!this._built) return;

    this._elements.isCurrentMarker.hidden = !!!this.data?.current;
    this._elements.id.textContent = this.data?.id;
    this._elements.issuedAt.textContent = this.data?.issued_at;
    this._elements.expiresAt.textContent = this.data?.expires_at;

    this._elements.lastUsedAt.textContent = this.data?.last_used_at;
    this._elements.ip.textContent = this.data?.ip;
    this._elements.userAgent.textContent = parseUserAgent(
      this.data?.user_agent ?? "",
    ).label;
  }
}

window.customElements.define("token-list-item", TokenListItem);
