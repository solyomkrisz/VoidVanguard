/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/ui/component/layout/DropdownMenu.js
 * Szerep: Lenyilo menu kattintasos mobil es hoveres desktop viselkedessel.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
export default class DropdownMenu extends HTMLElement {
  constructor() {
    super();

    this._open = false;

    this.onDocumentClick = this.onDocumentClick.bind(this);
    this.onToggle = this.onToggle.bind(this);
    this.onMouseEnter = this.onMouseEnter.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
    this.onResize = this.onResize.bind(this);
  }

  connectedCallback() {
    this.trigger = this.querySelector(".trigger");
    this.menu = this.querySelector(".menu");

    if (!this.trigger || !this.menu) {
      console.error("<dropdown-menu> requires .trigger and .menu elements");
      return;
    }

    this.style.position = "relative";
    this.style.display = "inline-block";

    this.menu.style.position = "absolute";
    this.menu.style.top = "100%";
    this.menu.style.display = "none";
    this.menu.style.zIndex = "1000";

    // Mobilon kattintas nyitja vagy zarja a menut.
    this.trigger.addEventListener("click", this.onToggle);

    // Desktopon a hover a megszokottabb viselkedes, ezt kulon kezeljuk.
    this.addEventListener("mouseenter", this.onMouseEnter);
    this.addEventListener("mouseleave", this.onMouseLeave);

    document.addEventListener("click", this.onDocumentClick);

    window.addEventListener("resize", this.onResize);
  }

  disconnectedCallback() {
    document.removeEventListener("click", this.onDocumentClick);
    window.removeEventListener("resize", this.onResize);
  }

  onToggle(e) {
    e.stopPropagation();

    this._open = !this._open;
    this.updateVisibility();

    if (this._open) {
      this.updatePosition();
    }
  }

  onDocumentClick(e) {
    if (!this.contains(e.target)) {
      this._open = false;
      this.updateVisibility();
    }
  }

  onMouseEnter() {
    if (window.matchMedia("(hover: hover)").matches) {
      this._open = true;
      this.updateVisibility();
      this.updatePosition();
    }
  }

  onMouseLeave() {
    if (window.matchMedia("(hover: hover)").matches) {
      this._open = false;
      this.updateVisibility();
    }
  }

  onResize() {
    if (this._open) {
      this.updatePosition();
    }
  }

  updateVisibility() {
    this.menu.style.display = this._open ? "block" : "none";
  }

  updatePosition() {
    // reset
    this.menu.style.left = "";
    this.menu.style.right = "";

    const rect = this.menu.getBoundingClientRect();

    const overflowRight = rect.right > window.innerWidth;
    const overflowLeft = rect.left < 0;

    // Ha kifutna jobbra, a menut a jobb szelhez igazítjuk vissza.
    if (overflowRight && !overflowLeft) {
      // snap right
      this.menu.style.right = "0";
      this.menu.style.left = "auto";
    } else {
      // default left
      this.menu.style.left = "0";
      this.menu.style.right = "auto";
    }
  }
}

window.customElements.define("dropdown-menu", DropdownMenu);
