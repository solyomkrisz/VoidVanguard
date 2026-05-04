import * as UI from "/ui/UI.js";

export default class TitleBar extends HTMLElement {
  constructor() {
    super();

    this.source = null;
    this.attachShadow({ mode: "open" });

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`
      :host {
        width: 100%;
        height: clamp(21px, 5.5vw, 24px);
        display: flex;
        align-items: center;
        gap: 0.35rem;
        padding-left: 0.5rem;
        padding-right: 0.32rem;
        border-top-left-radius: inherit;
        border-top-right-radius: inherit;
        background:
          linear-gradient(
            180deg,
            rgba(106, 184, 255, 0.12) 0%,
            rgba(106, 184, 255, 0) 22%
          ),
          linear-gradient(180deg, #202033 0%, #161624 100%);
        border-bottom: 1px solid #2a5a9e;
        color: #cbe9ff;
        font-family: "Jersey", "Courier New", monospace;
        font-size: clamp(0.53rem, 1.8vw, 0.68rem);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        user-select: none;
        cursor: grab;
        box-sizing: border-box;
      }

      :host(:active) {
        cursor: grabbing;
      }

      .label {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-shadow: 0 0 5px rgba(106, 184, 255, 0.32);
      }

      .collapse-btn {
        width: 20px;
        height: 16px;
        background: linear-gradient(
          180deg,
          rgba(84, 150, 220, 0.98) 0%,
          rgba(52, 112, 182, 0.98) 100%
        );
        border: 1px solid rgba(123, 214, 255, 0.85);
        border-radius: 3px;
        padding: 0;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #f5fbff;
        flex-shrink: 0;
        touch-action: manipulation;
        box-shadow:
          inset 0 0 0 1px rgba(14, 28, 44, 0.95),
          0 2px 0 0 rgba(26, 61, 104, 0.95);
        transition: transform 0.22s ease, filter 0.12s ease;
      }

      .collapse-btn:hover {
        filter: brightness(1.1);
      }

      .collapse-btn:active {
        transform: translateY(1px);
      }

      .collapse-btn:focus-visible {
        outline: 2px solid #9fd5ff;
        outline-offset: 1px;
      }

      .collapse-btn svg {
        width: 12px;
        height: 8px;
        display: block;
      }

      :host(.collapsed) .collapse-btn {
        transform: rotate(180deg);
      }

      @media (max-width: 900px), (hover: none) and (pointer: coarse) {
        :host {
          font-size: clamp(0.5rem, 1.55vw, 0.62rem);
          gap: 0.22rem;
          padding-left: 0.38rem;
          padding-right: 0.26rem;
        }

        .collapse-btn {
          width: 18px;
          height: 14px;
        }
      }
    `);
    this.shadowRoot.adoptedStyleSheets = [sheet];

    this.offsetX = 0;
    this.offsetY = 0;
    this._collapsed = false;
    this._dragPointerId = null;

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.toggleCollapsed = this.toggleCollapsed.bind(this);

    const label = document.createElement("span");
    label.className = "label";
    label.textContent = "Hajtóművezérlő";
    this.shadowRoot.appendChild(label);

    const collapseBtn = document.createElement("button");
    collapseBtn.className = "collapse-btn";
    collapseBtn.type = "button";
    collapseBtn.title = "Összecsuk / Kinyit";
    collapseBtn.innerHTML = `<svg viewBox="0 0 10 7" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polyline points="1,1 5,6 9,1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
    collapseBtn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleCollapsed();
    });
    collapseBtn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        this.toggleCollapsed();
      }
    });
    this.shadowRoot.appendChild(collapseBtn);
  }

  setSource(source) {
    this.source = source;
    return this;
  }

  toggleCollapsed() {
    if (!this.source) return;

    this._collapsed = !this._collapsed;

    this.classList.toggle("collapsed", this._collapsed);
    this.source.toggleAttribute("data-collapsed", this._collapsed);
  }

  onPointerDown(e) {
    if (!this.source) return;

    if (
      e.pointerType === "mouse" &&
      typeof e.button === "number" &&
      e.button !== 0
    ) {
      return;
    }

    const domRect = this.getBoundingClientRect();

    if (
      e.clientX >= domRect.left &&
      e.clientX <= domRect.right &&
      e.clientY >= domRect.top &&
      e.clientY <= domRect.bottom
    ) {
      this.source.dragged = true;
      this._dragPointerId = e.pointerId ?? null;
      this.offsetX = e.clientX - domRect.left;
      this.offsetY = e.clientY - domRect.top;
    }
  }

  onPointerMove(e) {
    if (!this.source?.dragged) return;
    if (this._dragPointerId !== null && e.pointerId !== this._dragPointerId) {
      return;
    }

    const domRect = this.source.getBoundingClientRect();

    if (!this.snapHorizontal(e, domRect)) {
      this.source.style.left = e.clientX - this.offsetX + "px";
      this.source.dataset.horizontalSnap = "none";
    }

    if (!this.snapVertical(e, domRect)) {
      this.source.style.top = e.clientY - this.offsetY + "px";
      this.source.dataset.verticalSnap = "none";
    }
  }

  onPointerUp(e) {
    if (!this.source) return;
    if (this._dragPointerId !== null && e.pointerId !== this._dragPointerId) {
      return;
    }

    this.source.dragged = false;
    this._dragPointerId = null;
  }

  // prettier-ignore
  snapHorizontal(e, domRect) {
    const snapOffset = 50;

    if (e.clientX - this.offsetX + domRect.width + snapOffset >= window.innerWidth) {
      this.source.style.left = window.innerWidth - domRect.width + "px";
      this.source.dataset.horizontalSnap = "right";
      return true;
    }

    if (e.clientX - this.offsetX - snapOffset <= 0) {
      this.source.style.left = 0 + "px";
      this.source.dataset.horizontalSnap = "left";
      return true;
    }

    return false;
  }

  // prettier-ignore
  snapVertical(e, domRect) {
    const snapOffset = 50;

    if (e.clientY - this.offsetY - snapOffset <= 0) {
      this.source.style.top = 0 + "px";
      this.source.dataset.verticalSnap = "top";
      return true;
    }

    if (e.clientY - this.offsetY + domRect.height + snapOffset >= window.innerHeight) {
      this.source.style.top = window.innerHeight - domRect.height + "px";
      this.source.dataset.verticalSnap = "bottom";
      return true;
    }

    return false;
  }

  connectedCallback() {
    document.addEventListener("pointerdown", this.onPointerDown);
    document.addEventListener("pointermove", this.onPointerMove);
    document.addEventListener("pointerup", this.onPointerUp);
    document.addEventListener("pointercancel", this.onPointerUp);
  }

  disconnectedCallback() {
    document.removeEventListener("pointerdown", this.onPointerDown);
    document.removeEventListener("pointermove", this.onPointerMove);
    document.removeEventListener("pointerup", this.onPointerUp);
    document.removeEventListener("pointercancel", this.onPointerUp);
  }
}

window.customElements.define("title-bar", TitleBar);
